// Read-only checks, restricted to the probe namespace. Never print credentials or URLs.
import fs from 'node:fs/promises';
import {S3Client,ListObjectsV2Command,ListMultipartUploadsCommand,ListPartsCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
const value=name=>String(process.env[name]||'').trim();
const bucket=value('S3_BUCKET'),endpoint=value('S3_ENDPOINT');
if(!bucket||!endpoint||!value('S3_ACCESS_KEY')||!value('S3_SECRET_KEY'))throw Error('Missing qualification environment');
const prefix='photobridge-compatibility-probes/',checks=[];
for(const forcePathStyle of [true,false]){
 const client=new S3Client({endpoint,region:'default',forcePathStyle,maxAttempts:1,credentials:{accessKeyId:value('S3_ACCESS_KEY'),secretAccessKey:value('S3_SECRET_KEY')}});
 for(const kind of ['objects','multiparts'])for(const transport of ['sdk','presigned']){
  const command=kind==='objects'?new ListObjectsV2Command({Bucket:bucket,Prefix:prefix,MaxKeys:1}):new ListMultipartUploadsCommand({Bucket:bucket,Prefix:prefix,MaxUploads:1});
  const result={pathStyle:forcePathStyle,kind,transport};
  try{
   if(transport==='sdk'){
    const response=await client.send(command);result.status=response.$metadata?.httpStatusCode;result.ok=true;
   }else{
    const url=await getSignedUrl(client,command,{expiresIn:90});const response=await fetch(url,{signal:AbortSignal.timeout(20000)});result.status=response.status;result.ok=response.ok;
    if(!response.ok){const body=await response.text();result.code=(body.match(/<Code>([A-Za-z0-9_.:-]{1,80})<\/Code>/)||[])[1]||'non_s3_response';}
   }
  }catch(error){result.ok=false;result.status=error.$metadata?.httpStatusCode||null;result.code=/^[A-Za-z0-9_.:-]{1,80}$/.test(error.name)?error.name:'request_failed';}
  checks.push(result);
 }
 client.destroy();
}
await fs.mkdir('work',{recursive:true});await fs.writeFile('work/liara-access-diagnostics.json',JSON.stringify({checks},null,2)+'\n');console.log(JSON.stringify({checks},null,2));
