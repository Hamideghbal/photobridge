const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1332-gallery-cards.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

function uploadHelper(status=200){
 const start=bundle.indexOf('function rs(t,a,s,r){');
 const end=bundle.indexOf('const Ny=',start);
 assert(start>=0&&end>start,'XHR helper missing');
 const code=bundle.slice(start,end);
 class FakeXHR {
  constructor(){this.upload={};this.status=status;this.headers={};}
  open(method,url){this.method=method;this.url=url;}
  setRequestHeader(k,v){this.headers[k]=v;}
  send(file){
   this.upload.onprogress?.({lengthComputable:true,loaded:50,total:100});
   this.onload?.();
  }
 }
 return vm.runInNewContext(code+';rs',{XMLHttpRequest:FakeXHR,Sr:()=>'',Math,Promise,Error,Object});
}
test('upload events are safe even when no progress callback is provided',async()=>{
 const rs=uploadHelper();
 await assert.doesNotReject(rs('/api/test',{type:'image/jpeg'}));
});
test('upload progress comes from real XHR bytes, with useful HTTP rejection',async()=>{
 const updates=[];
 await uploadHelper()('/api/test',{type:'image/jpeg'},percent=>updates.push(percent));
 assert.equal(updates[0],50);
 await assert.rejects(uploadHelper(413)('/api/test',{type:'image/jpeg'}),/upload_http_413/);
});
test('retouch progress stays in the original file button',()=>{
 assert(bundle.includes('className:"pb1338UploadFill"'));
 assert(bundle.includes('className:"pb1338UploadText"'));
 assert(bundle.includes('PB1338setProgress(Math.min(92,10+Math.round(p*.82)))'));
 assert(bundle.includes('PB1338setProgress(94),PB1338setStage("ثبت روی سرور")'));
 assert(bundle.includes('PB1338setProgress(100),PB1338setStage("تکمیل شد")'));
 assert(css.includes('.clientGalleryRetouchUpload .pb1338UploadFill'));
 assert(css.includes('.clientGalleryRetouchUpload .pb1338UploadText'));
});
test('oversize previews are recompressed before a bounded server upload',()=>{
 assert(bundle.includes('z.size>980*1024&&round<3'));
 assert(bundle.includes('if(z.size>1024*1024)throw Object.assign'));
 assert(bundle.includes('gallery_retouch_preview_too_large'));
 assert(bundle.includes('code==="upload_network_error"'));
});
test('R1337 behavior and R1338 cache versions remain intact',()=>{
 assert(bundle.includes('String(o?.gallery?.id||"")!==String(L)&&l(null)'));
 assert(bundle.includes('revisionUploaded:!!('));
 assert(/retouchReload=r(?:1340|1344)/.test(html));
 assert.equal((html.match(/retouchReload=r(?:1340|1344)/g)||[]).length,2);
 assert.match(fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim(),/^\d{4}-\d{2}-\d{2}-r\d+-[a-z0-9-]+$/);
});
