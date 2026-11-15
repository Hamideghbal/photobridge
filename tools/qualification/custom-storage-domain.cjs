const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createRequire}=require('node:module');
const sdk=createRequire(path.resolve(process.env.QUALIFICATION_NODE_ROOT||'.','package.json'));
const {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand}=sdk('@aws-sdk/client-s3'),{getSignedUrl}=sdk('@aws-sdk/s3-request-presigner');
const domain='https://files.photobridge.ir',origin='https://photobridge.ir',bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const fetchSafe=(url,options={})=>fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000),...options});
const errorCode=error=>({error:String(error.name||'Error'),status:Number(error.$metadata?.httpStatusCode||0)});
const corsOrigin=response=>['*',origin].includes(response.headers.get('access-control-allow-origin'));
function clientOptions(credentials,region,endpoint,bucketEndpoint=false){return {credentials,region,endpoint,bucketEndpoint,forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',maxAttempts:1}}
async function qualify(){
 for(const name of ['S3_ENDPOINT','S3_BUCKET','S3_ACCESS_KEY','S3_SECRET_KEY','S3_REGION'])if(process.env[name])process.env[name]=process.env[name].trim();
 const required=['S3_ENDPOINT','S3_BUCKET','S3_ACCESS_KEY','S3_SECRET_KEY'],missing=required.filter(name=>!process.env[name]);if(missing.length)throw Object.assign(Error('missing_configuration'),{missing});
 const endpoint=new URL(process.env.S3_ENDPOINT),bucket=process.env.S3_BUCKET;if(endpoint.protocol!=='https:'||!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))throw Error('invalid_configuration');
 const credentials={accessKeyId:process.env.S3_ACCESS_KEY,secretAccessKey:process.env.S3_SECRET_KEY},region=process.env.S3_REGION||'default',base=new S3Client(clientOptions(credentials,region,endpoint.href)),custom=new S3Client(clientOptions(credentials,region,domain,true));
 const id=crypto.randomUUID(),prefix='photobridge-compatibility-probes/'+id,keys=[prefix+'/custom-domain-control.png',prefix+'/custom-domain-put.png'],report={version:1,correlationId:id,hostname:new URL(domain).hostname,checks:{},cleanup:[]};
 try{
  await base.send(new PutObjectCommand({Bucket:bucket,Key:keys[0],Body:bytes,ContentType:'image/png'}));report.checks.backendControl=true;
  const unsigned=await fetchSafe(domain+'/'+keys[0]);report.checks.privateUnsignedGet=unsigned.status===403||unsigned.status===404||unsigned.status===401;report.unsignedStatus=unsigned.status;await unsigned.body?.cancel();
  const getUrl=await getSignedUrl(custom,new GetObjectCommand({Bucket:domain,Key:keys[0]}),{expiresIn:120}),get=await fetchSafe(getUrl,{headers:{Origin:origin}}),got=Buffer.from(await get.arrayBuffer());report.getStatus=get.status;report.checks.customGet=get.status===200&&got.length===bytes.length&&digest(got)===digest(bytes);report.checks.getCors=corsOrigin(get);
  const putUrl=await getSignedUrl(custom,new PutObjectCommand({Bucket:domain,Key:keys[1],ContentType:'image/png'}),{expiresIn:120});
  const preflight=await fetchSafe(putUrl,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'PUT','Access-Control-Request-Headers':'content-type'}});const methods=(preflight.headers.get('access-control-allow-methods')||'').toUpperCase().split(/\s*,\s*/),headers=(preflight.headers.get('access-control-allow-headers')||'').toLowerCase().split(/\s*,\s*/);report.preflightStatus=preflight.status;report.checks.putPreflight=preflight.ok&&corsOrigin(preflight)&&methods.includes('PUT')&&(headers.includes('*')||headers.includes('content-type'));await preflight.body?.cancel();
  if(!report.checks.privateUnsignedGet){report.checks.customPut=false;report.putSkipped='unsigned_object_was_public';return report}
  const put=await fetchSafe(putUrl,{method:'PUT',headers:{Origin:origin,'Content-Type':'image/png'},body:bytes});report.putStatus=put.status;report.checks.customPut=put.ok;report.checks.putCors=corsOrigin(put);await put.body?.cancel();
  if(put.ok){const stored=await base.send(new GetObjectCommand({Bucket:bucket,Key:keys[1]})),storedBytes=Buffer.from(await stored.Body.transformToByteArray());report.checks.finalIntegrity=storedBytes.length===bytes.length&&digest(storedBytes)===digest(bytes)}
 }catch(error){report.failure=errorCode(error)}finally{
  for(const key of keys){try{await base.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));report.cleanup.push({removed:true})}catch(error){report.cleanup.push(errorCode(error))}}
  base.destroy();custom.destroy();
 }
 return report;
}
if(require.main===module)(async()=>{let report;try{report=await qualify()}catch(error){report={version:1,failure:errorCode(error),missing:error.missing||[]}}fs.mkdirSync('work',{recursive:true});fs.writeFileSync('work/custom-storage-domain-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));const required=['backendControl','privateUnsignedGet','customGet','getCors','putPreflight','customPut','putCors','finalIntegrity'];if(!required.every(key=>report.checks?.[key])||!report.cleanup?.every(item=>item.removed))process.exitCode=1})();
module.exports={clientOptions};
