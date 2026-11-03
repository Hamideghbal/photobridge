'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.PB_NATIVE_UI_ROOT||'dist/web/lab-desktop-ui';
const fallback=process.env.PB_NATIVE_UI_FALLBACK||base;
const lab={id:'10000000-0000-4000-8000-000000000001',name:'لابراتوار تست'};
async function setup(page,loggedIn){
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='photobridge.ir')return route.fulfill({contentType:'text/html',body:'<h1>Browser handoff</h1>'});
  if(u.pathname.startsWith('/api/')){
   let body={};
   if(u.pathname==='/api/auth/me')return route.fulfill({status:loggedIn?200:401,json:loggedIn?{user:{userId:'user',labId:lab.id,labRole:'lab_admin',platformRole:'user',name:'مدیر'},lab}:{error:'unauthorized'}});
   if(u.pathname==='/api/lab/dashboard')body={lab,customers:[],temporaryCustomers:[],invitations:[],prices:[],hours:[],status:{open:true},ordersOpen:0,recentOrders:[],walletBalance:0,orderStats:{},collaborationPending:{count:0}};
   if(u.pathname==='/api/lab/site')body={lab,domains:[{hostname:'lab.example.com',active:true}]};
   if(u.pathname==='/api/lab/optional-features')body={features:{siteAvailable:true,siteEnabled:true,paidSubscription:true}};
   if(u.pathname==='/api/lab/domain-requests')body={requests:[]};
   if(u.pathname==='/api/lab/write-access')body={allowed:true,activeUntil:new Date(Date.now()+30*86400000).toISOString(),serverNow:new Date().toISOString()};
   if(u.pathname==='/api/lab/orders')body={orders:[]};
   if(u.pathname==='/api/lab/notifications')body={notifications:[],unread:0};
   return route.fulfill({json:body});
  }
  const name=path.extname(u.pathname)?u.pathname.slice(1):'index.html';
  let file=path.resolve(base,name);if(!fs.existsSync(file))file=path.resolve(fallback,name);
  return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404});
 });
}
test('actual Windows login omits homepage and actual editor click leaves the native local route',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  let page=await browser.newPage({viewport:{width:1440,height:1000}});await setup(page,false);
  await page.goto('http://localhost:49000/lab/login');await page.locator('input[type=password]').first().waitFor();
  assert.equal(await page.getByRole('link',{name:'صفحه اصلی',exact:true}).count(),0);
  await page.close();page=await browser.newPage({viewport:{width:1440,height:1000}});await setup(page,true);
  await page.goto('http://localhost:49000/lab/settings/site');
  const link=page.getByRole('link',{name:'ویرایش سایت',exact:true});try{await link.waitFor({timeout:8000})}catch(error){console.log(await page.locator('body').innerText());throw error;}
  assert.equal(await link.getAttribute('target'),null,'use installed will-navigate rather than child-window handling');
  await link.click();await page.waitForURL('https://photobridge.ir/lab/settings/site?openSiteEditor=1');
  assert.equal(await page.locator('h1').textContent(),'Browser handoff');
 }finally{await browser.close()}
});
