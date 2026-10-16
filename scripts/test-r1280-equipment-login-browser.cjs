const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const shop={id:'10000000-0000-4000-8000-000000000001',name:'دوربین تست',description:'',city:'تهران',province:'تهران',sale_enabled:true,rental_enabled:true};
const storeHost='https://cameras.example.org',mainHost='https://photobridge.ir';
const assets=new Set(['/equipment-site.js','/equipment-site.css','/equipment-album.js','/lab-storefront.css','/site-layout.js','/assets/photobridge-handover-vazirmatn.woff2']);
for(const width of [390,1440])for(const entry of ['header','office'])test('local '+entry+' login enters same photographer shop at '+width,async()=>{
 const {renderEquipmentPage}=await import('../dist/api/equipment-site-content.js');
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 let signed=false,logins=0,handoffs=0,centralPasswords=0;const errors=[];
 try{
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cameras.example.org/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname;
   const json=(status,obj)=>route.fulfill({status,contentType:'application/json; charset=utf-8',body:JSON.stringify(obj)});
   if(p==='/api/auth/me')return json(200,signed?{user:{labRole:'customer',name:'عکاس نمونه'}}:null);
   if(p==='/api/auth/customer-login'){
    logins++;const data=req.postDataJSON();
    assert.equal(data.mobile,'09120000000');
    if(data.password!=='good-password')return json(401,{error:'invalid_credentials'});
    signed=true;return json(200,{ok:true});
   }
   if(p==='/api/auth/equipment-store-handoff'){
    handoffs++;assert(signed);
    return json(200,{ok:true,redirectUrl:mainHost+'/auth/equipment-store-handoff?code='+('x'.repeat(43))});
   }
   if(assets.has(p)){
    const file=path.join('dist/web',p.slice(1));
    return route.fulfill({status:200,contentType:p.endsWith('.js')?'application/javascript; charset=utf-8':p.endsWith('.css')?'text/css; charset=utf-8':'font/woff2',body:fs.readFileSync(file)});
   }
   if(p==='/'||p==='/rental-equipment'){
    const html=renderEquipmentPage(shop,{},mainHost,{pathname:p,hostname:'cameras.example.org'}).html;
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
   }
   return route.fulfill({status:404,body:'not found'});
  });
  await page.route('https://photobridge.ir/**',async route=>{
   const req=route.request(),u=new URL(req.url());
   if(req.method()==='POST')centralPasswords++;
   if(u.pathname==='/auth/equipment-store-handoff')return route.fulfill({status:303,headers:{location:mainHost+'/equipment-rental/book?panel=rental&shopId='+shop.id,'cache-control':'no-store'},body:''});
   if(u.pathname==='/equipment-rental/book')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<!doctype html><html lang="fa"><meta charset="utf-8"><body><main id="rentalOffice">آفیش تجهیزات</main></body></html>'});
   return route.fulfill({status:404,body:'not found'});
  });
  await page.goto(storeHost+(entry==='office'?'/rental-equipment':'/'));
  if(entry==='header')await page.locator('.photographer-dropdown summary').click();
  const form=page.locator(entry==='header'?'#equipmentHeaderLogin':'#equipmentPageLogin');
  await form.waitFor({state:'visible'});
  await form.locator('[name=mobile]').fill('09120000000');
  await form.locator('[name=password]').fill('wrong-password');
  await form.locator('button[type=submit]').click();
  await page.getByText('شماره موبایل یا رمز عبور صحیح نیست.',{exact:true}).first().waitFor();
  assert.equal(handoffs,0,'bad password must never issue a handoff');
  await form.locator('[name=password]').fill('good-password');
  await form.locator('button[type=submit]').click();
  await page.waitForURL(url=>url.origin===mainHost&&url.pathname==='/equipment-rental/book'&&url.searchParams.get('shopId')===shop.id,{timeout:15000});
  await page.locator('#rentalOffice').waitFor();
  assert.equal(logins,2);
  assert.equal(handoffs,1);
  assert.equal(centralPasswords,0,'no password requests sent to central origin');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
