const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PB_PLAYWRIGHT_PATH||'playwright');
for(const width of [320,390,1366])test(`${width}px: photographer, lab and store login frames are narrower and usable`,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 for(const role of ['photographer','lab','rental']){
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.pathname.startsWith('/api/')){
    if(/auth|\/me$|session|current/.test(u.pathname))return route.fulfill({status:401,json:{error:'unauthorized'}});
    return route.fulfill({json:{items:[],labs:[],shops:[],notifications:[],settings:{},locations:{},roles:[],tabs:{ai:false,album:false,instagram:false}}});
   }
   const file=/^\/(?:photographer|lab|rental)(?:\/|$)/.test(u.pathname)?path.join(process.cwd(),role==='rental'?'dist/api/equipment-rental-portal.html':'dist/web/index.html'):path.join(process.cwd(),'dist/web',u.pathname.slice(1));
   return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
  });
  // The photographer entry redirects to Gallery before showing guest login.
  await page.goto(`https://panel.test/${role==='photographer'?'photographer/gallery':role}`);
  const shell=page.locator(role==='rental'?'#loginView>.authShell':'.unifiedLoginPage .unifiedLoginShell');
  await shell.waitFor({state:'visible'});
  assert(await shell.locator(role==='photographer'?'form.memberLogin':role==='lab'?'form.labLogin':'form.rentalUnifiedLogin:not(.hidden)').isVisible(),'the expected role login is shown');
  const dim=await shell.evaluate(el=>({width:el.getBoundingClientRect().width,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,overflow:el.scrollWidth>el.clientWidth+1}));
  console.log(role,width,dim);
  assert(dim.width<=420.1&&dim.width>Math.min(width-80,400));assert.equal(dim.overflow,false);assert(dim.left>=8);assert(dim.right<=width-8);if(width>767)assert.equal(dim.width,420);
  const input=shell.locator('input[type=tel],input[inputmode=tel]').first();await input.click();await input.fill('09123456789');assert.equal(await input.inputValue(),'09123456789');await input.focus();
  if(width<=767)assert.equal(await input.evaluate(el=>getComputedStyle(el).fontSize),'16px','mobile fields retain zoom-safe text size');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(errors,[]);await page.close();
 }
 }finally{await browser.close()}
});
