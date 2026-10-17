import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
import {renderEquipmentPage} from '../dist/api/equipment-site-content.js';
const shop={id:'test',name:'هنر هفتم',rental_enabled:true,sale_enabled:true};
for(const width of [320,390,1024,1280,1440])test(`equipment identity and home sections at ${width}`,async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width,height:900},isMobile:width<760});
 await page.route('https://equipment.test/**',async route=>{const u=new URL(route.request().url());
 if(u.pathname==='/'||u.pathname==='/products')return route.fulfill({contentType:'text/html',body:renderEquipmentPage(shop,{},'https://photobridge.ir',{pathname:u.pathname,hostname:u.hostname}).html});
 const file=path.join(process.cwd(),'dist/web',u.pathname);
 return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});});
 await page.goto('https://equipment.test/');
 assert.equal(await page.locator('.site-header .equipment-logo').isVisible(),width>760);assert.equal(await page.locator('.site-header .desktop-nav').isVisible(),width>760);assert.equal(await page.locator('.site-header .mobile-menu').isVisible(),width<=760);
 assert.equal(await page.locator('.equipment-brand-category').textContent(),'فروشگاه تجهیزات عکاسی و فیلم‌برداری');
 assert.equal(await page.locator('.equipment-mobile-home-sections').isVisible(),width<=760);
 if(width<=760){
 const bounds=await page.evaluate(()=>Object.fromEntries(['brand','mobile-menu','photographer-dropdown'].map(c=>[c,document.querySelector('.site-header .'+c).getBoundingClientRect().toJSON()])));
 assert(bounds['photographer-dropdown'].right<=bounds.brand.left+1,'login on the left');
 assert(bounds.brand.right<=bounds['mobile-menu'].left+1,'menu on the right');
 assert(Math.abs(bounds.brand.x+bounds.brand.width/2-width/2)<2,'shop identity centered');}
 if(width<=760){
 await page.locator('.mobile-menu summary').click();await page.locator('.mobile-menu-links a[href="/#equipment-services"]').click();
 await page.waitForURL('**/#equipment-services');assert.equal(await page.locator('.mobile-menu').getAttribute('open'),null);
 assert(await page.locator('#equipment-services [data-site-card]').count()>0);
 await page.locator('.hero .secondary').click();await page.waitForURL('**/#equipment-guides');
 assert.equal(await page.locator('#equipment-guides .guide-card').count(),3);
 await page.locator('.photographer-dropdown summary').click();assert(await page.locator('#equipmentHeaderLogin').isVisible());
 await page.getByRole('button',{name:'بستن ورود عکاسان',exact:true}).click();assert.equal(await page.locator('#equipmentHeaderLogin').isVisible(),false);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:`work/r1287-home-${width}.png`,fullPage:true});
 }
 }finally{await browser.close()}
});
