import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeEquipmentSite,renderEquipmentPage} from '../dist/api/equipment-site-content.js';

const shop={id:'example-shop',name:'فروشگاه آزمایشی',description:'',phone:'',address:'',city:'',province:'',sale_enabled:true,rental_enabled:true};
const render=(saved={},pathname='/')=>renderEquipmentPage(shop,saved,'https://photobridge.ir',{pathname,hostname:'camera.example.test',catalog:'<section id="catalog"></section>'}).html;

test('equipment custom-site footer only renders active configured links',()=>{
 const config={socialLinks:[
  {id:'w',label:'واتساپ',url:'https://wa.me/989121234567',enabled:true},
  {id:'i',label:'اینستاگرام',url:'https://instagram.com/example',enabled:false},
  {id:'x',label:'وب‌سایت دوم',url:'',enabled:false}
 ]};
 const merged=mergeEquipmentSite(shop,config);
 assert.equal(merged.socialLinks.length,3);
 const html=render(config);
 assert.match(html,/aria-label="شبکه‌های اجتماعی و پیوندهای فروشگاه"/);
 assert.match(html,/href="https:\/\/wa\.me\/989121234567"/);
 assert.doesNotMatch(html,/href="https:\/\/instagram\.com\/example"/);
 assert.doesNotMatch(html,/data-footer-icon-slot/);
});

test('footer URLs and labels are HTML escaped',()=>{
 const html=render({socialLinks:[{id:'a',label:'لینک "تست"',url:'https://example.com/?x=1&y=2',enabled:true}]});
 assert.match(html,/href="https:\/\/example\.com\/\?x=1&amp;y=2"/);
 assert.match(html,/aria-label="لینک &quot;تست&quot;"/);
});

test('header is outside scroller on all pages and login routes to PhotoBridge',()=>{
 for(const page of ['/','/equipment','/products','/rental-equipment','/contact']){
  const html=render({},page);
  assert.ok(html.indexOf('class="site-header"')<html.indexOf('class="equipment-page-scroll"'),page);
  assert.ok(html.indexOf('class="equipment-page-scroll"')<html.indexOf('class="site-footer"'),page);
  assert.match(html,/id="equipmentHeaderLogin"/);
  assert.match(html,/id="equipmentHeaderLogin"/);
  assert.doesNotMatch(html,/id="rentalBookingForm"/);
  assert.match(html,/<\/footer><\/div><script id="site-layout-data"/);
 }
});

test('header dimensions and scroller are stable in published CSS',()=>{
 const css=readFileSync(new URL('../dist/web/equipment-site.css',import.meta.url),'utf8');
 assert.match(css,/\.equipment-site>\.equipment-page-scroll\{[^}]*overflow-y:auto/);
 assert.match(css,/\.equipment-site>\.site-header\{[^}]*height:76px/);
 assert.match(css,/\.equipment-site \.desktop-nav a\[aria-current=page\]:after\{bottom:-4px/);
});
