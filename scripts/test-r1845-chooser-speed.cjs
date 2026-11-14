const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http'),zlib=require('node:zlib');
const server=fs.readFileSync('dist/api/server.js','utf8');
function functionText(name){const start=server.indexOf('function '+name+'(');assert(start>=0,name);const end=server.indexOf('\n}',start);return server.slice(start,end+2)}
test('actual HTTP handlers negotiate compressed CSS and final HTML, with raw fallback and private robots',async()=>{
 const context={fs,path,zlib,Buffer,process,DIST_ROOT:path.resolve('dist'),WEB_DIR:path.resolve('dist/web'),DEPLOY_REVISION:'test',indexGzipCache:new Map(),mime:file=>file.endsWith('.css')?'text/css':'text/html',seoStandaloneHtml:()=>null,seoInjectHtml:(html,pathname)=>html+'<!-- final SEO '+pathname+' -->',seoPrivatePath:p=>p.startsWith('/photographer')};
 vm.createContext(context);vm.runInContext(['acceptsHtmlEncoding','rentalHtmlPayload','serveEquipmentRentalPage','serveWeb'].map(functionText).join('\n'),context);
 const app=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://local').pathname;pathname==='/equipment-rental/book'?context.serveEquipmentRentalPage(req,res,'equipment-rental-book.html'):context.serveWeb(req,res,pathname)});
 await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const request=(url,encoding,method='GET')=>new Promise((resolve,reject)=>{http.request({host:'127.0.0.1',port:app.address().port,path:url,method,headers:{'accept-encoding':encoding}},res=>{const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({headers:res.headers,status:res.statusCode,body:Buffer.concat(chunks)}))}).on('error',reject).end()});
 try{
 for(const [url,limit,encoding] of [['/assets/index-UIRefine-v586.css?v=674',400000,'br'],['/equipment-rental/book',80000,'br'],['/',25000,'gzip']]){
  const result=await request(url,'br, gzip');assert.equal(result.status,200);assert.equal(result.headers['content-encoding'],encoding);assert.match(result.headers.vary,/accept-encoding/i);assert(result.body.length<limit,url+': '+result.body.length);assert.equal(+result.headers['content-length'],result.body.length);
  console.log(url,result.body.length+' transferred bytes');
  const raw=await request(url,'identity');assert.equal(raw.headers['content-encoding'],undefined);assert.deepEqual(encoding==='br'?zlib.brotliDecompressSync(result.body):zlib.gunzipSync(result.body),raw.body);
  const head=await request(url,'br, gzip','HEAD');assert.equal(head.body.length,0);assert.equal(head.headers['content-length'],result.headers['content-length']);
  if(!url.startsWith('/assets'))assert.match(result.headers['cache-control'],/no-store/);
 }
 const privatePage=await request('/photographer/orders/flow?workspace=print','gzip');assert.match(privatePage.headers['x-robots-tag'],/noindex/);assert.match(zlib.gunzipSync(privatePage.body).toString(),/final SEO \/photographer\/orders\/flow/);
 const denied=await request('/equipment-rental/book','br;q=0, gzip;q=0');assert.equal(denied.headers['content-encoding'],undefined);
 for(let i=0;i<70;i++)await request('/photographer/cache-'+i,'gzip');assert(context.indexGzipCache.size<=64);
 }finally{await new Promise(r=>app.close(r))}
});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
for(const width of [390,1366])test('labs prefetch network order, frame-zero cached paint, single consumption and 401 cleanup at '+width,async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width,height:844}});
 const html=fs.readFileSync('dist/web/index.html','utf8'),prefetch=html.match(/<script id="pb1845LabsPrefetch">([\s\S]*?)<\/script>/)?.[1];assert(prefetch,'prefetch in built head');
 const chooser=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
 let calls=0,release;const gate=new Promise(r=>release=r);let requested;const firstRequest=new Promise(r=>requested=r);
 await page.addInitScript(()=>{sessionStorage.setItem('photobridge:r100f14:lab-chooser',JSON.stringify({data:{memberships:[{id:'cached',name:'Cached Lab',active:true}],labs:[]}}));window.firstChooserFrame=null;function sample(){if(document.getElementById('pbR99LabChooser')&&window.firstChooserFrame===null)window.firstChooserFrame=document.getElementById('pbR99LabChooser').textContent;requestAnimationFrame(sample)}requestAnimationFrame(sample)});
 await page.route('**/*',async route=>{const p=new URL(route.request().url()).pathname;
 if(p==='/api/customer/labs'){calls++;requested();await gate;return route.fulfill({status:401,json:{error:'unauthorized'}})}
 if(p==='/chooser.js')return route.fulfill({contentType:'text/javascript',body:chooser});
 if(p==='/main.js')return route.fulfill({contentType:'text/javascript',body:'window.mainFinished=true;'});
 return route.fulfill({contentType:'text/html',body:'<html><head><script>'+prefetch+'</script></head><body><div id="root"></div><script src="/chooser.js"></script><script type="module" src="/main.js"></script></body></html>'});
 });
 await page.goto('https://labs.test/photographer/orders/flow?workspace=print&pbLabChooser=1');await firstRequest;
 await page.waitForFunction(()=>window.firstChooserFrame!==null);assert.match(await page.evaluate(()=>window.firstChooserFrame),/Cached Lab/);assert.equal(calls,1);assert.equal(await page.evaluate(()=>Object.hasOwn(window,'__PBLabsEarly')),false);
 assert.equal(await page.evaluate(()=>window.mainFinished),true);release();await page.waitForFunction(()=>!document.getElementById('pbR99LabChooser'));assert.equal(calls,2,'null early response retries through API for 401 cleanup');
 await page.close();
 // Real built index: hold the main module response, observe labs request before it can execute.
 const real=await browser.newPage({viewport:{width,height:844}});let mainRelease;const moduleGate=new Promise(r=>mainRelease=r);let labsSeen;const labsRequest=new Promise(r=>labsSeen=r);
 await real.route('**/*',async route=>{const p=new URL(route.request().url()).pathname;if(p==='/api/customer/labs'){labsSeen();return route.fulfill({json:{memberships:[],labs:[]}})}if(p.startsWith('/api/'))return route.fulfill({json:{}});if(p.startsWith('/assets/')&&p.endsWith('.js'))await moduleGate;const file=path.join(process.cwd(),'dist/web',p.startsWith('/photographer')?'index.html':p.slice(1));return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''})});
 const navigation=real.goto('https://labs.test/photographer/orders/flow?workspace=print&pbLabChooser=1',{waitUntil:'domcontentloaded'});await Promise.race([labsRequest,new Promise((_,reject)=>setTimeout(()=>reject(Error('no early labs request')),10000))]);assert.equal(await real.evaluate(()=>!!document.querySelector('#root')?.childElementCount),false,'labs requested before main module executes');mainRelease();await navigation;await real.close();
 }finally{await browser.close()}
});
test('prefetch is restricted to explicit photographer Print/chooser routes and resolves failures to null',async()=>{
 const js=fs.readFileSync('scripts/r1845-labs-prefetch.js','utf8');
 for(const [pathname,search,expected] of [['/photographer/orders/flow','?workspace=print',1],['/photographer','?pbLabChooser=1',1],['/photographer/gallery','',0],['/','?workspace=print',0],['/equipment-rental/book','?pbLabChooser=1',0]]){
  for(const failure of ['http','network','json']){
   let count=0,cleared=false;const context={window:{},location:{pathname,search},URLSearchParams,AbortController,setTimeout:()=>1,clearTimeout:()=>cleared=true,fetch:async(url,options)=>{count++;assert.equal(url,'/api/customer/labs');assert.equal(options.credentials,'include');if(failure==='network')throw Error('offline');return {ok:failure!=='http',json:async()=>{throw Error('bad json')}}}};
   vm.runInNewContext(js,context);assert.equal(count,expected);if(expected){assert.equal(await context.window.__PBLabsEarly,null);assert(cleared)}
  }
 }
});
