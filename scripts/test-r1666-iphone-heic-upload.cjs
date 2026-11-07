'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('R1666 filename normalized and original path components sanitized',()=>{
 const s=fs.readFileSync('dist/api/server.js','utf8');
 const a=s.indexOf('function safeFileName(name) {'),b=s.indexOf('function orderPrintCopyName(',a);
 assert(a>=0&&b>a);
 const safe=new Function(s.slice(a,b)+'\nreturn safeFileName;')();
 assert.equal(safe('folder/عکس ✨.HEIC'),'عکس _.heic');
 assert.equal(safe('C:\\bad\\CON.JPG'),'_CON.jpg');
 assert(s.includes("map(safeFileName),name].join('/')"));
});
test('R1666 HEIC converter exists in backend and worker',()=>{
 const s=fs.readFileSync('dist/api/server.js','utf8');
 assert(s.includes("pb1666HeicFallback(src,output)"));
 assert(s.includes("new URL('./heic-worker.cjs',import.meta.url)"));
 assert(s.includes("width=COALESCE(NULLIF(width,0),$5)"));
 const worker=fs.readFileSync('dist/api/heic-worker.cjs','utf8');
 assert(worker.includes("require('heic-convert')"));
 assert(worker.includes("format:'JPEG'"));
 assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).dependencies['heic-convert'],'2.1.0');
});
test('R1666 HEIC browser filters and album warning',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes('webp|tif?f|psd|heic|heif'));
  assert(js.includes('issue:"heic_server_conversion"'));
  assert(js.includes('function pb1666IsBrowserHeic(item){'));
  assert.equal(fs.readFileSync(root+'/index.html','utf8').split('iphoneHeic=r1666').length-1,1);
 }
});
