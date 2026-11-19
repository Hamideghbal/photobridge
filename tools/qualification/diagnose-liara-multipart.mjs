// Creates one EMPTY probe session, not a photo; compare provider query/auth variants.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {S3Client,CreateMultipartUploadCommand,ListPartsCommand,AbortMultipartUploadCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
const env=name=>String(process.env[name]||'').trim(),key='photobridge-compatibility-probes/'+crypto.randomUUID()+'/empty-probe.bin',bucket=env('S3_BUCKET');
const config={endpoint:env('S3_ENDPOINT'),region:'default',maxAttempts:1,credentials:{accessKeyId:env('S3_ACCESS_KEY'),secretAccessKey:env('S3_SECRET_KEY')}};
const checks=[];let uploadId;const clients=[];
const make=(forcePathStyle,bareQuery)=>{const c=new S3Client({...config,forcePathStyle});clients.push(c);if(bareQuery)c.middlewareStack.add(next=>async args=>{delete args.request.query?.['x-id'];return next(args)},{step:'build',name:'providerBareQuery'});return c};
const first=make(true,false);
const safe=error=>({status:error.$metadata?.httpStatusCode||null,code:error.name,requestId:error.$metadata?.requestId||null});
try{
 uploadId=(await first.send(new CreateMultipartUploadCommand({Bucket:bucket,Key:key,ContentType:'application/octet-stream',Metadata:{'pb-probe':'multipart-diagnostics-v1'}}))).UploadId;
 if(!uploadId)throw Error('MissingUploadId');
 for(const pathStyle of [true,false])for(const bareQuery of [false,true])for(const transport of ['sdk','presigned']){
  const c=make(pathStyle,bareQuery),entry={pathStyle,bareQuery,transport};
  const command=new ListPartsCommand({Bucket:bucket,Key:key,UploadId:uploadId});
  try{
   if(transport==='sdk'){const r=await c.send(command);entry.status=r.$metadata?.httpStatusCode;entry.ok=true;}
   else{const url=await getSignedUrl(c,command,{expiresIn:60}),r=await fetch(url,{signal:AbortSignal.timeout(15000)});entry.status=r.status;entry.ok=r.ok;entry.requestId=r.headers.get('x-amz-request-id');if(!r.ok){const text=await r.text();entry.code=(text.match(/<Code>([A-Za-z0-9_.:-]{1,80})<\/Code>/)||[])[1]||'non_s3_response';}}
  }catch(error){Object.assign(entry,{ok:false},safe(error))}
  checks.push(entry);
 }
}finally{
 let cleaned=false;
 if(uploadId)for(const pathStyle of [true,false])for(const bareQuery of [false,true]){
  if(cleaned)continue;const c=make(pathStyle,bareQuery),entry={operation:'abort-empty-test',pathStyle,bareQuery};
  try{await c.send(new AbortMultipartUploadCommand({Bucket:bucket,Key:key,UploadId:uploadId}));entry.ok=true;cleaned=true}catch(error){Object.assign(entry,{ok:false},safe(error))}checks.push(entry);
 }
 await fs.mkdir('work',{recursive:true});
 // IDs belong only to the probe; private artifact permits later cleanup without exposing URLs/credentials.
 if(uploadId&&!cleaned)await fs.writeFile('work/liara-empty-probe-recovery.json',JSON.stringify({key,uploadId,empty:true})+'\n');
 const report={emptySessionCreated:!!uploadId,cleanupPending:!!uploadId&&!cleaned,checks};await fs.writeFile('work/liara-multipart-diagnostics.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));for(const c of clients)c.destroy();
}
