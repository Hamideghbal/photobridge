const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),os=require('node:os');
const read=file=>fs.readFileSync(file,'utf8');
function bundledCss(html,name){const match=html.match(/href="(\/assets\/photobridge-boot-[a-f0-9]+\.css)[^"]*"/);return !!match&&read('dist/web'+match[1]).includes(read('dist/web/'+name));}
function serveFunction(){const source=read('dist/api/server.js'),start=source.indexOf('function serveWeb('),end=source.indexOf('\nconst BUILTIN_ADMIN_MOBILE',start);assert(start>0&&end>start);return source.slice(start,end)}
test('CRM HTML is never immutable or returned as a stale 304, while images retain normal caching',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'crm-cache-'));fs.writeFileSync(path.join(root,'customer-crm.html'),'<main>new customer calendar</main>');fs.writeFileSync(path.join(root,'image.png'),'image');
 const serve=vm.runInNewContext(serveFunction()+';serveWeb',{fs,path,Buffer,WEB_DIR:root,DEPLOY_REVISION:'crm-test',mime:file=>file.endsWith('.html')?'text/html; charset=utf-8':'image/png',seoStandaloneHtml:()=>null,sendText:(res,status,text)=>{res.writeHead(status);res.end(text)}});
 const server=http.createServer((req,res)=>serve(req,res,new URL(req.url,'http://test').pathname));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const base='http://127.0.0.1:'+server.address().port;
 const first=await fetch(base+'/customer-crm.html?portal=photographer');assert.equal(first.status,200);assert.match(first.headers.get('cache-control'),/no-store/);assert.equal(first.headers.get('x-photobridge-deploy-revision'),'crm-test');assert.equal(first.headers.get('pragma'),'no-cache');await first.text();
 const next=await fetch(base+'/customer-crm.html?portal=lab',{headers:{'if-none-match':first.headers.get('etag')}});assert.equal(next.status,200);assert.match(await next.text(),/new customer calendar/);
 const image=await fetch(base+'/image.png');assert.match(image.headers.get('cache-control'),/immutable/);await image.text();
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true})}
});
test('final portal entry points bust the previously immutable navigation URLs',()=>{
 for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 const html=read(file);assert.match(html,/customer-crm-host\.js\?v=r1867-crm-delivery/);assert(/customer-crm-host\.css\?v=r1867-crm-delivery/.test(html)||bundledCss(html,'customer-crm-host.css'));assert(html.includes('rev='+encodeURIComponent(read('DEPLOY_REVISION.txt').trim())));
 assert.match(html,/photobridge-r1761-crm-nav\.js\?v=r1867-crm-delivery/);assert.match(html,/photobridge-r1126-desktop-navigation\.js\?v=r1867-crm-delivery/);
 }
 const nav=read('dist/web/photobridge-r1126-desktop-navigation.js');assert.match(nav,/window\.pbCrmFrameUrl/);assert.match(nav,/crmRev=r1867-crm-delivery/);assert.match(nav,/if\(key==='crm'&&u\.pathname!=='.customer-crm.html'\)/);
 assert.match(read('dist/web/photobridge-r1761-crm-nav.js'),/window\.pbCrmOpen\(portal\)/);
});
test('CRM content has no back link and suppresses its separate header inside the portal',()=>{
 const html=read('dist/web/customer-crm.html');assert.doesNotMatch(html,/id="back"|بازگشت به PhotoBridge/);assert.match(html,/window\.self!==window\.top/);assert.match(html,/html\.crmEmbedded body>header/);assert.match(html,/customer-crm-ui\.js\?v=r1867/);
 assert.doesNotMatch(read('dist/web/customer-crm-ui.js'),/\$\('back'\)\.href/);
 for(const file of ['dist/web/customer-crm-host.js','dist/web/photobridge-r1761-crm-nav.js','dist/web/photobridge-r1126-desktop-navigation.js'])new vm.Script(read(file));
});
