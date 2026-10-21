const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require(process.env.PB_PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const root=path.resolve('dist/web');
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end('{}');return;}
  const file=path.join(root,pathname==='/'?'index.html':pathname);
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.PB_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  for(const width of [390,1366]){
   const page=await browser.newPage({viewport:{width,height:900}});
   // Deliberately hold the navigation decorator after React has started mounting.
   let release;const held=new Promise(r=>release=r);
   await page.route('**/photobridge-public-nav-v625.js?*',async route=>{await held;await route.continue()});
   const loaded=page.goto(base,{waitUntil:'load'});
   await page.waitForSelector('#root',{state:'attached'});
   await page.evaluate(()=>{const b=document.createElement('button');b.textContent='ورود';document.getElementById('root').append(b)});
   assert.equal(await page.locator('#root').evaluate(el=>getComputedStyle(el).visibility),'hidden','unpolished React markup must never paint');
   release();await loaded;
   await page.waitForFunction(()=>!document.documentElement.classList.contains('pb1330HomePending'));
   const install=page.locator('.pbMobileInstallHomeAction');await install.waitFor({state:'visible'});
   const style=await install.evaluate(el=>{const s=getComputedStyle(el);return {radius:s.borderRadius,font:s.fontFamily,bg:s.backgroundImage,height:el.offsetHeight}});
   assert.equal(style.radius,'12px');assert(style.font.includes('Vazirmatn'));assert(style.bg.includes('linear-gradient'));assert(style.height>=44);
   await page.evaluate(()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{window.installPromptCalled=true};e.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(e)});
   await install.click();await page.waitForFunction(()=>window.installPromptCalled===true);
   await page.close();console.log(`PASS ${width}px: delayed first paint, styled install button and native install action`);
  }
  for(const width of [1024,1366,1920]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const css=fs.readFileSync('dist/web/photobridge-r1310-layout.css','utf8');
   await page.setContent(`<html class="pb1310GalleryHome pb1126Desktop"><style>*{box-sizing:border-box}body{margin:0}#root{padding:20px 16px}.clientGalleryWorkspace{width:100%}#storePhotographerWorkspace{padding:0 16px}</style><style>${css}</style><div id="root"><div class="clientGalleryWorkspace"><details class="clientGalleryIntro pb1159Intro"><summary>گالری</summary>توضیحات</details><div id="cards">گالری‌ها</div></div></div><div id="storePhotographerWorkspace"><div class="pbR96StoreChooser"><div class="pbR96StoreChooserHead">فروشگاه</div></div></div><div id="pbR99LabChooser"><div class="pbR99LabWrap"><div class="pbR99LabIntro">چاپ</div></div></div></html>`);
   const box=selector=>page.locator(selector).boundingBox();
   const [gallery,store,lab,cards]=await Promise.all(['.clientGalleryIntro','.pbR96StoreChooserHead','.pbR99LabIntro','#cards'].map(box));
   assert.equal(gallery.width,760);assert.equal(gallery.width,store.width);assert.equal(gallery.x,store.x);assert.equal(gallery.width,lab.width);assert.equal(gallery.x,lab.x);assert.equal(cards.width,width-32,'only intro is constrained, gallery cards remain full width');
   await page.close();console.log(`PASS ${width}px: gallery intro matches Store/Print width and alignment; gallery cards stay full width`);
  }
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
