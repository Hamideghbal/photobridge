import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let src=fs.readFileSync(path,'utf8');
function one(s,a,b,tag){const n=s.split(a).length-1;if(n!==1)throw Error('R1182 '+tag+': '+n+' matches for '+a.slice(0,100));return s.replace(a,b);}
function section(start,end,change){
 const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
 if(a<0||b<0)throw Error('R1182 route not found: '+start);
 src=src.slice(0,a)+change(src.slice(a,b))+src.slice(b);
}
function pb1182Helpers(){
 // Read-only HEAD check; choose the identical object for preflight, preview and GET.
 async function pb1182Exists(key){
  const val=String(key||'').trim();
  if(!val)return false;
  if(val.startsWith('client-local-recovery/'))return true;
  if(val.startsWith('local/'))try{return fs.existsSync(localPathForKey(val))}catch{return false}
  if(!storageConfigured)return false;
  try{await storageStat(val);return true}catch{return false}
 }
 async function pb1182Choose(row){
  const original=String(row.object_key||'').trim(),prepared=String(row.print_object_key||'').trim();
  if(prepared&&await pb1182Exists(prepared))return{key:prepared,available:true,fallback:false,deviceLocal:prepared.startsWith('client-local-recovery/')};
  if(original&&await pb1182Exists(original))return{key:original,available:true,fallback:!!prepared&&original!==prepared,deviceLocal:original.startsWith('client-local-recovery/')};
  return{key:prepared||original,available:false,fallback:false,deviceLocal:false};
 }
}
if(!src.includes('PB1182 coherent source and print object resolution')){
 const funcs=pb1182Helpers.toString().replace(/^function pb1182Helpers\(\)\s*\{/,'').replace(/}\s*$/,'');
 src=one(src,'        const labOrderDownloadCheck = url.pathname.match(',
  '        // PB1182 coherent source and print object resolution.\n'+funcs+'\n        const labOrderDownloadCheck = url.pathname.match(','helper install');
 section('        const labOrderDownloadCheck = url.pathname.match(','        const labAlbumDownloadComplete = url.pathname.match(',s=>{
  s=one(s,'SELECT id,object_key,original_name FROM order_files','SELECT id,object_key,print_object_key,original_name FROM order_files','preflight keys');
  s=one(s,'const rows = fq.rows, missing = [];','const rows = fq.rows, missing = [], fallback = [];','preflight arrays');
  const start=s.indexOf("                    const key = String(row.object_key || '').trim();"),end=s.indexOf('                    if (!ok)',start);
  if(start<0||end<0)throw Error('R1182 preflight scan missing');
  s=s.slice(0,start)+"                    const chosen=await pb1182Choose(row),ok=chosen.available;\n                    if(ok&&chosen.fallback)fallback.push(row.original_name);\n"+s.slice(end);
  return one(s,'return sendJson(res, 200, { ok: true, fileCount: rows.length });',
   'return sendJson(res, 200, { ok: true, fileCount: rows.length, fallbackOriginalCount:fallback.length, fallbackNames:fallback.slice(0,8) });','preflight result');
 });
 section('        const labFilePreview = url.pathname.match(','        const labFileDownload = url.pathname.match(',s=>{
  s=one(s,'SELECT COALESCE(print_object_key,object_key) object_key,COALESCE(print_name,original_name) original_name,COALESCE(print_content_type,content_type) content_type,print_conversion_status FROM order_files',
    'SELECT object_key,print_object_key,original_name,print_name,content_type,print_content_type,print_conversion_status FROM order_files','preview select');
  s=one(s,"            const row = q.rows[0];",
    "            const row = q.rows[0], chosen = await pb1182Choose(row);\n            if(!chosen.available)return sendJson(res,404,{error:'file_not_found'});\n            const fileName=chosen.fallback?row.original_name:(row.print_name||row.original_name);\n            const fileType=chosen.fallback?row.content_type:(row.print_content_type||row.content_type);",'preview chosen source');
  s=one(s,"if (!String(row.content_type || '').startsWith('image/'))","if (!String(fileType || '').startsWith('image/'))",'preview media');
  s=s.replaceAll("String(row.object_key || '').startsWith('client-local-recovery/')","chosen.deviceLocal");
  s=s.replaceAll("String(row.object_key || '').startsWith('local/')","String(chosen.key || '').startsWith('local/')");
  s=s.replaceAll('localPathForKey(row.object_key)','localPathForKey(chosen.key)');
  s=s.replaceAll('key: row.object_key','key: chosen.key');
  s=s.replaceAll('name: row.original_name','name: fileName');
  s=s.replaceAll('contentType: row.content_type','contentType: fileType');
  if(!s.includes('key: chosen.key')||!s.includes('name: fileName'))throw Error('R1182 preview key substitutions failed');
  return s;
 });
 section('        const labFileDownload = url.pathname.match(','        const labFileEditPresign = url.pathname.match(',s=>{
  s=one(s,'SELECT COALESCE(f.print_object_key,f.object_key) object_key,COALESCE(f.print_name,f.original_name) original_name,COALESCE(f.print_content_type,f.content_type) content_type,f.print_conversion_status,o.settlement_mode,o.payment_status FROM order_files',
    'SELECT f.object_key,f.print_object_key,f.original_name,f.print_name,f.content_type,f.print_content_type,f.bytes,f.print_bytes,f.print_conversion_status,o.settlement_mode,o.payment_status FROM order_files','download keys');
  s=one(s,"            const row = q.rows[0];",
    "            const row = q.rows[0], chosen = await pb1182Choose(row);\n            if(!chosen.available)return sendJson(res,404,{error:'file_not_found'});\n            const fileName=chosen.fallback?row.original_name:(row.print_name||row.original_name);\n            const fileType=chosen.fallback?row.content_type:(row.print_content_type||row.content_type);\n            const fileBytes=chosen.fallback?Number(row.bytes||0):Number(row.print_bytes||row.bytes||0);",'download chosen');
  s=s.replaceAll("String(row.object_key || '').startsWith('client-local-recovery/')","chosen.deviceLocal");
  s=s.replaceAll("String(row.object_key || '').startsWith('local/')","String(chosen.key || '').startsWith('local/')");
  s=s.replaceAll('localPathForKey(row.object_key)','localPathForKey(chosen.key)');
  s=s.replaceAll('key: row.object_key','key: chosen.key');
  s=s.replaceAll('name: row.original_name','name: fileName');
  s=s.replaceAll('contentType: row.content_type','contentType: fileType');
  s=s.replaceAll('expiresIn: 300 });','expiresIn: 300, fallbackOriginal:chosen.fallback, bytes:fileBytes });');
  if(!s.includes('key: chosen.key')||!s.includes('fallbackOriginal:chosen.fallback'))throw Error('R1182 download substitutions failed');
  return s;
 });
 section('    const publicDownload = url.pathname.match(','    const publicGalleryMatch = url.pathname.match(',s=>
  one(s,
   'const obj = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: item.key, ...(range ? { Range: range } : {}) }));',
   'const request=new GetObjectCommand({ Bucket:S3_BUCKET,Key:item.key,...(range?{Range:range}:{}) });\n            let obj;try{obj=await(s3Download||s3).send(request)}catch(firstError){if(!s3Download||s3Download===s3)throw firstError;obj=await s3.send(request)}',
   'stream through path-style download client with legacy fallback'));
 fs.writeFileSync(path,src);
}
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
