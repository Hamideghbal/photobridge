const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=fs.readFileSync('dist/api/server.js','utf8');
const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
function region(start,end){const a=api.indexOf(start),b=api.indexOf(end,a);assert.ok(a>=0&&b>a,start);return api.slice(a,b)}
test('one read-only resolver HEAD-checks the object actually used by preview/download',()=>{
 assert.match(api,/PB1182 coherent source and print object resolution/);
 assert.match(api,/async function pb1182Choose\(row\)/);
 assert.match(api,/pb1182Exists\(prepared\)/);
 assert.match(api,/pb1182Exists\(original\)/);
 assert.match(api,/storageStat\(val\)/);
 assert.match(api,/client-local-recovery/);
});
test('download check does not falsely test only the original when print-ready exists',()=>{
 const r=region('const labOrderDownloadCheck =','const labAlbumDownloadComplete =');
 assert.match(r,/SELECT id,object_key,print_object_key,original_name/);
 assert.match(r,/pb1182Choose\(row\)/);
 assert.match(r,/download_files_unavailable/);
 assert.match(r,/fallbackOriginalCount:fallback.length/);
 assert.doesNotMatch(r,/const key = String\(row.object_key/);
});
test('preview uses real image MIME and recovers stored original when print derivative disappeared',()=>{
 const r=region('const labFilePreview =','const labFileDownload =');
 assert.match(r,/SELECT object_key,print_object_key,original_name,print_name,content_type,print_content_type/);
 assert.match(r,/chosen = await pb1182Choose\(row\)/);
 assert.match(r,/chosen.fallback\?row.content_type:/);
 assert.match(r,/key: chosen.key/);
 assert.match(r,/name: fileName/);
 assert.match(r,/contentType: fileType/);
 assert.match(r,/error:'file_not_found'/);
});
test('actual download uses same selected key and gives accurate name to lab workstation',()=>{
 const r=region('const labFileDownload =','const labFileEditPresign =');
 assert.match(r,/chosen = await pb1182Choose\(row\)/);
 assert.match(r,/String\(chosen.key \|\| ''\).startsWith\('local\/'\)/);
 assert.match(r,/key: chosen.key/);
 assert.match(r,/fallbackOriginal:chosen.fallback/);
 assert.match(r,/name: fileName/);
});
test('opaque download tokens GET via dedicated path-style S3 client with safe fallback',()=>{
 const r=region('const publicDownload =','const publicGalleryMatch =');
 assert.match(r,/s3Download\|\|s3/);
 assert.match(r,/obj=await s3.send\(request\)/);
 assert.match(r,/res.writeHead\(obj.ContentRange \? 206 : 200/);
 assert.match(r,/cache-control': 'private, no-store'/);
});
test('release build applies patch with no database or uploaded-file mutation',()=>{
 assert.match(build,/enable-r1182-lab-file-availability/);
 assert.match(html,/\/assets\/index-UIRefine/);
 const script=fs.readFileSync('scripts/enable-r1182-lab-file-availability.mjs','utf8');
 assert.doesNotMatch(script,/DELETE FROM order_files|UPDATE order_files|storageDelete\(/);
});

test('recovered original downloads under true source filename and true source byte count',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert.match(ui,/pbDownloadName=filename/);
 assert.match(ui,/pbDownloadName/);
 assert.match(ui,/pbDownloadBytes/);
 assert.match(ui,/downloadName=o.pbDownloadName\|\|a.original_name/);
 assert.match(ui,/downloadBytes=Number\(o.pbDownloadBytes\|\|a.bytes\|\|0\)/);
 assert.match(ui,/preflight.fallbackOriginalCount/);
 const r=region('const labFileDownload =','const labFileEditPresign =');
 assert.match(r,/const fileBytes=chosen.fallback\?Number\(row.bytes\|\|0\)/);
 assert.match(r,/bytes:fileBytes/);
});
