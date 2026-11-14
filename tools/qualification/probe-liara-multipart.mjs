// Real provider qualification only. Uses only a fresh, isolated probe key in the authorized bucket.
// Does not access existing objects, change CORS, or touch production PostgreSQL.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {S3Client,CreateMultipartUploadCommand,UploadPartCommand,ListPartsCommand,CompleteMultipartUploadCommand,HeadObjectCommand,GetObjectCommand,AbortMultipartUploadCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
for(const name of ['S3_ENDPOINT','S3_BUCKET','S3_ACCESS_KEY','S3_SECRET_KEY'])assert(process.env[name],name+' is required; supply credentials through environment, never command arguments');
assert.equal(process.env.PB_MULTIPART_PROBE_ISOLATED_PREFIX,'1','Explicit isolated-prefix qualification required');
await fs.mkdir('work',{recursive:true});
const endpoint=new URL(process.env.S3_ENDPOINT);assert.equal(endpoint.protocol,'https:');
const config={endpoint:endpoint.href,region:process.env.S3_REGION||'default',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY,secretAccessKey:process.env.S3_SECRET_KEY},maxAttempts:1};
const bucket=process.env.S3_BUCKET,key='photobridge-compatibility-probes/'+crypto.randomUUID()+'/multipart.bin';
const origin=process.env.PB_MULTIPART_PROBE_ORIGIN||'https://photobridge.ir';
const report={provider:'Liara',at:new Date().toISOString(),endpointHost:endpoint.host,operations:{},checksum:null,cors:null,etagIsOpaque:true};
let uploadId,completed=false;const client=new S3Client(config),fresh=()=>new S3Client(config);
const params=()=>({Bucket:bucket,Key:key,UploadId:uploadId});
const md5=body=>crypto.createHash('md5').update(body).digest('base64');
const body=crypto.randomBytes(5*1024*1024),last=crypto.randomBytes(19),sum=crypto.createHash('sha256').update(body).update(last).digest('hex');
try{
 const created=await client.send(new CreateMultipartUploadCommand({Bucket:bucket,Key:key,ContentType:'application/octet-stream',Metadata:{'pb-probe':'multipart-v1'}}));
 assert(created.UploadId);uploadId=created.UploadId;report.operations.create=true;
 const wrong=await getSignedUrl(client,new UploadPartCommand({...params(),PartNumber:1,ContentMD5:md5(Buffer.from('different bytes'))}),{expiresIn:120});
 const invalid=await fetch(wrong,{method:'PUT',headers:{'content-md5':md5(Buffer.from('different bytes'))},body,signal:AbortSignal.timeout(60000)});
 report.operations.rejectsCorruptPart=!invalid.ok;assert(!invalid.ok,'provider must reject invalid Content-MD5 before this integrity profile can be enabled');
 const url=await getSignedUrl(client,new UploadPartCommand({...params(),PartNumber:1,ContentMD5:md5(body)}),{expiresIn:120});
 const preflight=await fetch(url,{method:'OPTIONS',headers:{origin,'access-control-request-method':'PUT','access-control-request-headers':'content-md5'},signal:AbortSignal.timeout(15000)});
 report.cors={status:preflight.status,origin:preflight.headers.get('access-control-allow-origin'),methods:preflight.headers.get('access-control-allow-methods'),headers:preflight.headers.get('access-control-allow-headers'),expose:preflight.headers.get('access-control-expose-headers')};
 const first=await fetch(url,{method:'PUT',headers:{'content-md5':md5(body),origin},body,signal:AbortSignal.timeout(60000)});assert.equal(first.ok,true,'presigned direct UploadPart must work');
 const etag=first.headers.get('etag');assert(etag,'provider must return a part ETag');report.operations.presignedUploadPart=true;
 // A new SDK instance represents process/browser restart. The first part stays in storage.
 const restarted=fresh();const listed=await restarted.send(new ListPartsCommand({...params(),MaxParts:1}));
 assert.equal(listed.Parts?.length,1);assert.equal(listed.Parts[0].PartNumber,1);assert.equal(Number(listed.Parts[0].Size),body.length);assert.equal(listed.Parts[0].ETag,etag);report.operations.listAfterRestart=true;
 const part2=await restarted.send(new UploadPartCommand({...params(),PartNumber:2,ContentMD5:md5(last),Body:last}));
 const all=await restarted.send(new ListPartsCommand({...params(),MaxParts:1}));assert.equal(all.IsTruncated,true);assert(all.NextPartNumberMarker);const next=await restarted.send(new ListPartsCommand({...params(),PartNumberMarker:all.NextPartNumberMarker}));assert.equal(next.Parts[0].PartNumber,2);report.operations.pagination=true;
 await restarted.send(new CompleteMultipartUploadCommand({...params(),MultipartUpload:{Parts:[{PartNumber:1,ETag:etag},{PartNumber:2,ETag:part2.ETag}]}}));completed=true;report.operations.complete=true;
 const head=await restarted.send(new HeadObjectCommand({Bucket:bucket,Key:key}));assert.equal(Number(head.ContentLength),body.length+last.length);assert.equal(head.Metadata?.['pb-probe'],'multipart-v1');report.operations.head=true;
 // Test-only readback verifies provider bytes; production API never proxies photo bytes.
 const read=await restarted.send(new GetObjectCommand({Bucket:bucket,Key:key}));const hash=crypto.createHash('sha256');for await(const chunk of read.Body)hash.update(chunk);assert.equal(hash.digest('hex'),sum);report.operations.exactBytes=true;
 let noUpload=false;try{await restarted.send(new ListPartsCommand(params()))}catch(e){noUpload=e.name==='NoSuchUpload'||e.$metadata?.httpStatusCode===404}assert(noUpload,'completion must be reconcilable by HEAD after upload ID disappears');report.operations.reconcileAfterLostComplete=true;
 const exposed=(first.headers.get('access-control-expose-headers')||'').toLowerCase().split(',').map(s=>s.trim());
 assert([origin,'*'].includes(first.headers.get('access-control-allow-origin')),'browser origin must be allowed');assert(exposed.includes('etag')||exposed.includes('*'),'browser must be able to read ETag');assert(preflight.ok,'Content-MD5 preflight must succeed');
 report.checksum='content-md5-validated';report.qualified=true;restarted.destroy();
}catch(error){report.qualified=false;report.failure={name:error.name,status:error.$metadata?.httpStatusCode||null,reason:/Assertion/.test(error.name)?error.message:'provider request failed (details intentionally redacted)'};process.exitCode=1;
}finally{
 if(uploadId&&!completed)await client.send(new AbortMultipartUploadCommand(params())).catch(()=>{report.cleanupPending=true});
 if(completed)await client.send(new DeleteObjectCommand({Bucket:bucket,Key:key})).catch(()=>{report.cleanupPending=true});
 client.destroy();await fs.writeFile('work/liara-multipart-capability-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
