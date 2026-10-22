'use strict';
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),crypto=require('node:crypto');
const {Writable}=require('node:stream');

const root=fs.mkdtempSync(path.join(os.tmpdir(),'photobridge-r1351-ui-'));
after(()=>fs.rmSync(root,{recursive:true,force:true}));
function write(name,content){
 const dst=path.join(root,name);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,content);
 return Buffer.from(content);
}
const labIndex=write('lab-desktop-ui/index.html','<!doctype html><title>ORIGINAL</title><div id="root"></div>');
const png=write('lab-desktop-ui/logo.png',Buffer.from([137,80,78,71,13,10,26,10,1,2,3]));
const js=write('lab-desktop-ui/runtime.js','console.log("ORIGINAL");');
write('index.html','<!doctype html><title>ORIGINAL</title><div id="root"></div>');
const server=fs.readFileSync('dist/api/server.js','utf8');
const start=server.indexOf('function serveWeb(req, res, pathname) {');
const end=server.indexOf('const BUILTIN_ADMIN_MOBILE',start);
assert(start>=0&&end>start,'real server static web handler must remain extractable');
let seoCalls=0;
const serveWeb=vm.runInNewContext(server.slice(start,end)+'\nserveWeb',{
 fs,path,Buffer,WEB_DIR:root,
 mime:p=>({'.html':'text/html; charset=utf-8','.png':'image/png','.js':'text/javascript; charset=utf-8'}[path.extname(p)]||'application/octet-stream'),
 seoStandaloneHtml:()=>null,
 seoPrivatePath:()=>false,
 seoInjectHtml:html=>{seoCalls++;return html.replace('ORIGINAL','INJECTED');},
 sendText:(res,status,body)=>{res.writeHead(status,{'content-type':'text/plain'});res.end(body);}
});
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
async function fetchPath(pathname,headers={}){
 const parts=[],res=new Writable({write(chunk,_,cb){parts.push(Buffer.from(chunk));cb();}});
 res.writeHead=(status,header)=>{res.statusCode=status;res.responseHeaders=header;};
 const done=new Promise((resolve,reject)=>{res.once('finish',resolve);res.once('error',reject);});
 serveWeb({method:'GET',headers},res,pathname);
 await done;
 return {status:res.statusCode,headers:res.responseHeaders,bytes:Buffer.concat(parts)};
}
test('lab UI index is served byte for byte without SEO injection so manifest SHA-256 validates',async()=>{
 const before=seoCalls;
 const r=await fetchPath('/lab-desktop-ui/index.html');
 assert.equal(r.status,200);
 assert.equal(sha(r.bytes),sha(labIndex));
 assert.deepEqual(r.bytes,labIndex);
 assert.equal(seoCalls,before,'desktop UI index must not run site SEO transform');
 assert.match(r.headers['cache-control'],/no-store/);
});
test('lab UI images and JS use no-store, not public immutable cache; ETag cannot yield 304',async()=>{
 for(const [filename,raw]of [['logo.png',png],['runtime.js',js]]){
  const url='/lab-desktop-ui/'+filename;
  const first=await fetchPath(url);
  assert.equal(first.status,200);
  assert.equal(sha(first.bytes),sha(raw));
  assert.match(first.headers['cache-control'],/no-store/);
  assert.doesNotMatch(first.headers['cache-control'],/immutable/);
  const second=await fetchPath(url,{'if-none-match':first.headers.etag});
  assert.equal(second.status,200,'lab updater requires the actual bytes, never a 304');
  assert.deepEqual(second.bytes,raw);
 }
});
test('unknown lab UI asset returns 404 instead of an HTML app shell with a false SHA mismatch',async()=>{
 const r=await fetchPath('/lab-desktop-ui/missing.png');
 assert.equal(r.status,404);
 assert.notEqual(sha(r.bytes),sha(labIndex));
});
test('normal site index keeps its SEO processing without changing public routing',async()=>{
 const before=seoCalls;
 const r=await fetchPath('/');
 assert.equal(r.status,200);
 assert.match(r.bytes.toString('utf8'),/INJECTED/);
 assert.equal(seoCalls,before+1);
});
test('production Docker build applies the server patch after preparing the final Lab UI manifest',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const prepare=build.lastIndexOf('await deployStep("./prepare-lab-desktop-ui.mjs?final-after-r1344")');
 const patch=build.lastIndexOf('await deployStep("./enable-r1351-lab-ui-exact-byte-serving.mjs")');
 const testRun=build.lastIndexOf('scripts/test-r1351-lab-ui-exact-byte-serving.cjs');
 assert(prepare>=0&&patch>prepare&&testRun>patch);
});
