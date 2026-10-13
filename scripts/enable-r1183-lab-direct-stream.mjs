import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';let src=fs.readFileSync(path,'utf8');
function once(a,b){const count=src.split(a).length-1;if(count!==1)throw Error('R1183 server anchor '+count+' '+a.slice(0,100));src=src.replace(a,b)}
async function pb1183DirectRoute(){
 // Authenticated lab endpoint; works across multiple processes/restarts without in-memory download tokens.
 const match=url.pathname.match(/^\/api\/lab\/order-files\/([0-9a-f-]+)\/content$/);
 if(match&&req.method==='GET'){
  const isDownload=url.searchParams.get('download')==='1';
  const id=match[1];
  const fq=await pool.query("SELECT f.object_key,f.print_object_key,f.original_name,f.print_name,f.content_type,f.print_content_type,f.bytes,f.print_bytes,o.settlement_mode,o.payment_status FROM order_files f JOIN orders o ON o.id=f.order_id WHERE f.id=$1 AND f.lab_id=$2 AND f.original_state<>'deleted' LIMIT 1",[id,labId]);
  if(!fq.rowCount)return sendJson(res,404,{error:'file_not_found'});
  const row=fq.rows[0];
  if(isDownload){
   const deviceQ=await pool.query("SELECT primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1",[labId]);
   const device=deviceQ.rows[0]||{};
   if(!device.primary_download_device_id)return sendJson(res,409,{error:'download_device_not_registered'});
   if(!requestDeviceId||requestDeviceId!==device.primary_download_device_id)return sendJson(res,403,{error:'not_primary_download_device',label:device.primary_download_device_label||null});
   if(row.settlement_mode==='prepaid'&&row.payment_status!=='paid')return sendJson(res,409,{error:'payment_required'});
  }
  const prepared=String(row.print_object_key||'').trim(),original=String(row.object_key||'').trim();
  const candidates=[];
  if(prepared)candidates.push({key:prepared,name:String(row.print_name||row.original_name||'photo'),type:String(row.print_content_type||row.content_type||'application/octet-stream'),fallback:false});
  if(original&&(!prepared||original!==prepared))candidates.push({key:original,name:String(row.original_name||'photo'),type:String(row.content_type||'application/octet-stream'),fallback:!!prepared});
  if(!candidates.length)return sendJson(res,404,{error:'file_not_found'});
  const range=String(req.headers.range||'').trim();
  let unavailable=false,localOnly=false;
  for(const item of candidates){
   if(!isDownload&&!item.type.toLowerCase().startsWith('image/'))continue;
   if(item.key.startsWith('client-local-recovery/')){localOnly=true;continue;}
   const headers={
    'content-type':item.type,
    'content-disposition':(isDownload?'attachment':'inline')+"; filename*=UTF-8''"+encodeURIComponent(item.name),
    'x-pb-file-name':encodeURIComponent(item.name),
    'x-pb-fallback-original':item.fallback?'1':'0',
    'cache-control':'private, no-store',
    'accept-ranges':'bytes',
    'access-control-expose-headers':'x-pb-file-name, x-pb-fallback-original, content-length, content-range'
   };
   if(item.key.startsWith('local/')){
    try{
     const filePath=localPathForKey(item.key),st=await fs.promises.stat(filePath);
     if(!st.isFile()||st.size===0){unavailable=true;continue;}
     const parts=range.match(/^bytes=(\d+)-(\d*)$/);
     const start=parts?Math.max(0,Number(parts[1])):0;
     const end=parts?Math.min(st.size-1,parts[2]?Number(parts[2]):st.size-1):st.size-1;
     if(start>=st.size||end<start)return sendJson(res,416,{error:'range_not_satisfiable'});
     headers['content-length']=String(end-start+1);
     if(parts)headers['content-range']='bytes '+start+'-'+end+'/'+st.size;
     res.writeHead(parts?206:200,headers);
     const stream=fs.createReadStream(filePath,{start,end});
     stream.on('error',e=>{console.error('PB1183 lab local stream error',{fileId:id,error:e?.code||e?.name});res.destroy(e)});
     stream.pipe(res);return;
    }catch(e){unavailable=true;console.warn('PB1183 local file unavailable',{fileId:id,error:e?.code||e?.name});continue;}
   }
   if(!storageConfigured){unavailable=true;continue;}
   for(const client of [s3Download,s3]){
    if(!client)continue;
    try{
     const obj=await client.send(new GetObjectCommand({Bucket:S3_BUCKET,Key:item.key,...(range?{Range:range}:{})}));
     const body=obj?.Body;
     if(!body||typeof body.pipe!=='function')throw new Error('stream_unavailable');
     headers['content-type']=obj.ContentType||item.type;
     if(Number.isFinite(Number(obj.ContentLength)))headers['content-length']=String(obj.ContentLength);
     if(obj.ContentRange)headers['content-range']=String(obj.ContentRange);
     res.writeHead(obj.ContentRange?206:200,headers);
     body.on('error',e=>{console.error('PB1183 lab S3 stream interrupted',{fileId:id,error:e?.name||'stream_failed'});res.destroy(e)});
     body.pipe(res);
     return;
    }catch(e){
     unavailable=true;
     console.warn('PB1183 lab storage GET failed',{fileId:id,stage:item.fallback?'original':'print',status:e?.$metadata?.httpStatusCode||null,error:e?.name||'get_failed'});
    }
   }
  }
  return sendJson(res,unavailable?502:localOnly?409:404,{error:unavailable?'file_storage_unavailable':localOnly?'local_file_only':'file_not_found',fileId:id,originalTried:!!original,printTried:!!prepared});
 }
}
if(!src.includes('PB1183 authenticated lab image stream')){
 const body=pb1183DirectRoute.toString().replace(/^async function pb1183DirectRoute\(\)\s*\{/,'').replace(/}\s*$/,'');
 once('        const labFilePreview = url.pathname.match(',
 '        // PB1183 authenticated lab image stream: no transient per-process URL token.\n'+body+'\n        const labFilePreview = url.pathname.match(');
 // HEAD of one storage endpoint is not a reliable gate for a subsequent GET
 // from another provider endpoint. Per-file authenticated GET checks real availability.
 const start=src.indexOf('        const labOrderDownloadCheck = url.pathname.match('),end=src.indexOf('        const labAlbumDownloadComplete = url.pathname.match(',start);
 if(start<0||end<0)throw Error('R1183 preflight block missing');
 let segment=src.slice(start,end);
 const old="const chosen=await pb1182Choose(row),ok=chosen.available;";
 if(segment.split(old).length!==2)throw Error('R1183 preflight resolver anchor missing');
 segment=segment.replace(old,"const ok=Boolean(String(row.object_key||row.print_object_key||'').trim());");
 src=src.slice(0,start)+segment+src.slice(end);
 fs.writeFileSync(path,src);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
