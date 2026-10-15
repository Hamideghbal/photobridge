const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const api=fs.readFileSync('dist/api/server.js','utf8');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const section=(from,to)=>{let a=api.indexOf(from),b=api.indexOf(to,a);assert.ok(a>=0&&b>a);return api.slice(a,b)};
test('Authenticated stream is inside lab admin role gate, not a public token',()=>{
 const start=api.indexOf("if (url.pathname.startsWith('/api/lab/'))");
 const stream=api.indexOf('PB1183 authenticated lab image stream');
 assert.ok(start>=0&&stream>start);
 assert.ok(section('PB1183 authenticated lab image stream','const labFilePreview').includes('order-files'));
 assert.match(section('PB1183 authenticated lab image stream','const labFilePreview'),/req.method==='GET'/);
 assert.doesNotMatch(section('PB1183 authenticated lab image stream','const labFilePreview'),/downloadTokens/);
});
test('The direct path GETs print-ready first, then original, and only streams successful storage reads',()=>{
 const block=section('PB1183 authenticated lab image stream','const labFilePreview');
 assert.match(block,/const candidates=\[\]/);
 assert.match(block,/if\(prepared\)candidates.push/);
 assert.match(block,/if\(original&&\(!prepared\|\|original!==prepared\)\)candidates.push/);
 assert.match(block,/for\(const client of \[s3Download,s3\]\)/);
 assert.match(block,/new GetObjectCommand/);
 assert.match(block,/body.pipe\(res\)/);
 assert.match(block,/file_storage_unavailable/);
 assert.match(block,/file_not_found/);
 assert.match(block,/originalTried:!!original/);
});
test('Authenticated download still requires primary lab machine and paid invoice',()=>{
 const block=section('PB1183 authenticated lab image stream','const labFilePreview');
 assert.match(block,/if\(isDownload\)/);
 assert.match(block,/not_primary_download_device/);
 assert.match(block,/download_device_not_registered/);
 assert.match(block,/payment_required/);
 assert.match(block,/original_state<>'deleted'/);
});
test('Preflight checks both stored object keys without referencing a removed resolver result',()=>{
 const block=section('const labOrderDownloadCheck =','const labAlbumDownloadComplete');
 assert.match(block,/row\.object_key\|\|row\.print_object_key/);
 assert.doesNotMatch(block,/chosen\.fallback/);
 assert.match(block,/download_files_unavailable/);
});
test('Lab thumbnails, lightbox and download use authenticated direct stream, not preview token',()=>{
 assert.match(ui,/PB1183 authenticated image transport/);
 assert.match(ui,/async function pb1183PreviewFile\(fileId\)/);
 assert.match(ui,/content\?download=0/);
 assert.match(ui,/async function Ky\(fileId\)/);
 assert.match(ui,/content\?download=1/);
 assert.match(ui,/x-pb-file-name/);
 const start=ui.indexOf('function qu({file:t,detail:a,onOpen:s})');
 const end=ui.indexOf('function O0(t)',start);
 const components=ui.slice(start,end);
 assert.match(components,/await pb1183PreviewFile\(t.id\)/);
 assert.match(components,/await pb1183PreviewFile\(y.id\)/);
 assert.doesNotMatch(components,/\/preview/);
 assert.match(components,/pb1183PreviewMessage/);
 assert.match(components,/تلاش مجدد/);
});
test('Photo blobs are freed when thumbnail or lightbox changes',()=>{
 assert.match(ui,/URL\.revokeObjectURL\(f\)/);
 assert.match(ui,/URL\.revokeObjectURL\(E\)/);
 assert.match(ui,/URL\.revokeObjectURL\(h\)/);
});
test('Every file stays in original storage; no file mutations for diagnostics or streaming',()=>{
 const patchServer=fs.readFileSync('scripts/enable-r1183-lab-direct-stream.mjs','utf8');
 const patchUi=fs.readFileSync('scripts/enable-r1183-lab-image-ui.mjs','utf8');
 assert.doesNotMatch(patchServer,/UPDATE order_files|DELETE FROM order_files|storageDelete\(/);
 assert.doesNotMatch(patchUi,/method:"DELETE"|method:'DELETE'/);
 assert.match(html,/photobridge-r1183-lab-image-errors\.css\?v=r1183/);
 assert.match(html,/stream=r1183/);
});
