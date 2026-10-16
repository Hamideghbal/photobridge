const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const original=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
const loginMarkup=original.match(/<section id="authNeeded"[^]*?<\/section>/)?.[0];
assert(loginMarkup?.includes('id="equipmentOfficeLogin"'),'login form must ship in the real office document');
assert(original.includes('photobridge-r1279-equipment-office-login.js'));

for(const width of [390,1440])test('cross-domain office entry authenticates only on PhotoBridge then opens equipment store at '+width,async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const origin='https://photobridge.ir';
 let authenticated=false,posts=0,seenPasswords=[],meCalls=0;
 try{
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://photobridge.ir/**',async route=>{
   const req=route.request(),url=new URL(req.url()),pathname=url.pathname;
   const json=(status,obj)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(obj)});
   if(pathname==='/api/auth/me'){meCalls++;return json(authenticated?200:401,authenticated?{user:{labRole:'customer',name:'عکاس تست'}}:{error:'unauthorized'});}
   if(pathname==='/api/auth/customer-login'){
    assert.equal(req.headers()['x-photobridge-portal'],'photographer');
    const data=req.postDataJSON();posts++;seenPasswords.push(data.password);
    if(data.password==='bad')return json(401,{error:'credentials_invalid'});
    authenticated=true;return json(200,{ok:true});
   }
   if(pathname==='/photographer/gallery')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="fa"><body><main id="photographerStoreReached">فروشگاه فوتوبریج</main></body></html>'});
   if(pathname==='/equipment-rental/book'){
    const html='<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<script defer src="/photobridge-r1106-mobile-store-panel.js"></script>'+
    '<script defer src="/photobridge-r1126-desktop-navigation.js"></script>'+
    '<script defer src="/photobridge-r1279-equipment-office-login.js"></script></head><body>'+
    loginMarkup+'<section id="app" style="display:none"></section></body></html>';
    return route.fulfill({status:200,contentType:'text/html',body:html});
   }
   const asset=pathname.slice(1);
   if(['photobridge-r1106-mobile-store-panel.js','photobridge-r1126-desktop-navigation.js','photobridge-r1279-equipment-office-login.js'].includes(asset)){
    return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path.resolve('dist/web',asset),'utf8')});
   }
   return route.fulfill({status:404,body:'missing'});
  });
  await page.goto(origin+'/equipment-rental/book?panel=rental&pbOfficeLogin=1');
  await page.locator('#equipmentOfficeLogin').waitFor({state:'visible'});
  assert.equal(posts,0);
  assert(meCalls>=1);
  assert.equal(new URL(page.url()).pathname,'/equipment-rental/book','first-party form stays visible before login');
  await page.locator('[name=mobile]').fill('09121234567');
  await page.locator('[name=password]').fill('bad');
  await page.locator('#equipmentOfficeLogin button').click();
  await page.waitForTimeout(900);
  const loginMessage=await page.locator('#equipmentOfficeLoginMessage').textContent();
  assert.equal(loginMessage,'شماره موبایل یا رمز عبور صحیح نیست.',JSON.stringify({posts,seenPasswords,errors,url:page.url(),loginMessage}));
  assert.equal(posts,1);
  await page.locator('[name=password]').fill('valid-password');
  await page.locator('#equipmentOfficeLogin button').click();
  await page.waitForURL(url=>url.pathname==='/photographer/gallery'&&url.searchParams.get(width<821?'pbStorePanel':'pbDesktopPanel')==='store',{timeout:12000});
  await page.locator('#photographerStoreReached').waitFor();
  assert.deepEqual(seenPasswords,['bad','valid-password']);
  assert.equal(await page.locator('#equipmentOfficeLogin').count(),0);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('public equipment site never embeds the user password in redirect links',async()=>{
 const src=fs.readFileSync('dist/api/equipment-site-content.js','utf8');
 assert(src.includes('id="equipmentHeaderLogin"'));
 assert(src.includes('equipmentHeaderLogin'));
 assert(!src.includes('password='));
});
