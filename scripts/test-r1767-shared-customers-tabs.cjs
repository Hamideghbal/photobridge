'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const nav=fs.readFileSync('dist/web/photobridge-r1761-crm-nav.js','utf8');
const admin=fs.readFileSync('dist/web/photobridge-r1099-photographer-tabs.js','utf8');
const api=fs.readFileSync('dist/api/photographer-tab-settings.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('R1767: one Customers checkbox exists in admin photographer tab settings',()=>{
 assert.match(api,/PHOTOGRAPHER_TAB_KEYS=\['ai','album','instagram','customers'\]/);
 assert.match(admin,/customers:'مشتریان \(عکاس و لابراتوار\)'/);
 assert.match(api,/customers:effective\.customers/);
 assert.doesNotMatch(admin,/حساب عکاسی ادمین همیشه به هر سه تب دسترسی دارد/);
});
test('R1767: both navigation assets use fresh versions and do not affect unrelated pages',()=>{
 assert.equal((html.match(/photobridge-r1761-crm-nav\.js\?v=r1767/g)||[]).length,1);
 assert.equal((html.match(/photobridge-r1761-crm-nav\.css\?v=r1767/g)||[]).length,1);
 assert.equal((html.match(/photobridge-r1099-photographer-tabs\.js\?v=1767/g)||[]).length,1);
 assert.match(nav,/enabled=data\?\.tabs\?\.customers===true/);
 assert.match(nav,/if\(enabled!==true\)\{clearButtons\(\);return;\}/);
 assert.match(nav,/credentials:'include',cache:'no-store'/);
 new vm.Script(nav);
});
function scene(portal,mobile){
 let allowed=true;let calls=0;const events={},frames=[];
 const buttons=[];
 const target={
  children:[],dataset:{},hidden:false,
  classList:{contains:x=>mobile&&x==='photographerBottomAppNavGrid'},
  closest:()=>null,
  style:{values:{},setProperty(k,v){this.values[k]=v}},
  append(b){b.parentElement=this;this.children.push(b);buttons.push(b)},
  insertBefore(b){this.append(b)},
  get firstElementChild(){return this.children[0]||null},
  querySelector(q){
   if(q==='button[data-source=".albumTopNav"]')return null;
   if(q===':scope > button[data-pb1761-crm]')return this.children.find(x=>x.dataset.pb1761Crm)||null;
   return null;
  }
 };
 const document={
  readyState:'complete',hidden:false,body:{classList:{contains:()=>false}},
  getElementById:id=>id==='root'?{}:null,
  createElement:tag=>({
   tagName:tag.toUpperCase(),dataset:{},className:'',textContent:'',parentElement:null,
   classList:{contains(k){return this.owner.className.split(' ').includes(k)}},
   setAttribute(){},addEventListener(){},append(){},remove(){
    if(!this.parentElement)return;
    const array=this.parentElement.children;
    array.splice(array.indexOf(this),1);
    this.parentElement=null;
   }
  }),
  querySelector(selector){
   if(selector==='#root .labRoleWorkspace .labSingleHeader')return portal==='lab'?{}:null;
   if(selector==='#root main.photographerMain')return portal==='photographer'?{}:null;
   if(selector==='#root .labRoleWorkspace .pb1147LabNav')return !mobile&&portal==='lab'?target:null;
   if(selector==='#root .photographerHomeModeNav')return !mobile&&portal==='photographer'?target:null;
   return null;
  },
  querySelectorAll(selector){
   if(selector==='button[data-pb1761-crm]')return target.children.filter(x=>x.dataset.pb1761Crm);
   if(mobile&&portal==='lab'&&selector.includes('.labBottomAppNavGrid'))return [target];
   if(mobile&&portal==='photographer'&&selector.includes('.photographerBottomAppNav:not('))return [target];
   return [];
  },
  addEventListener(name,fn){events['doc:'+name]=fn}
 };
 const context={
  document,location:{pathname:portal==='lab'?'/lab':'/photographer',assign(){}},
  matchMedia:()=>({matches:mobile,addEventListener(){}}),
  MutationObserver:class{observe(){}},requestAnimationFrame:fn=>frames.push(fn),
  getComputedStyle:()=>({display:'flex'}),
  sessionStorage:{getItem:()=>null},
  fetch:async()=>{calls++;return {ok:true,json:async()=>({tabs:{customers:allowed}})}},
  window:{addEventListener(name,fn){events[name]=fn},pb1761CrmNavigation:false}
 };
 // Mock classList references the host button's className.
 const originalCreate=document.createElement;
 document.createElement=(tag)=>{const el=originalCreate(tag);el.classList.owner=el;return el};
 vm.runInNewContext(nav,context);
 return {
  target,events,requests:()=>calls,setAllowed:v=>{allowed=v},
  async flush(){
   for(let i=0;i<12;i++){
    while(frames.length)frames.shift()();
    await Promise.resolve();
    await Promise.resolve();
   }
  }
 };
}
test('R1767: one switch hides and restores Customers in both portals, mobile and desktop',async()=>{
 for(const portal of ['lab','photographer'])for(const mobile of [true,false]){
  const page=scene(portal,mobile);
  await page.flush();
  assert.equal(page.target.children.filter(b=>b.dataset.pb1761Crm===portal).length,1,
   'ON: '+portal+' mobile='+mobile);
  page.setAllowed(false);page.events.focus();
  await page.flush();
  assert.equal(page.target.children.filter(b=>b.dataset.pb1761Crm===portal).length,0,
   'OFF: '+portal+' mobile='+mobile);
  page.setAllowed(true);page.events.focus();
  await page.flush();
  assert.equal(page.target.children.filter(b=>b.dataset.pb1761Crm===portal).length,1,
   'RESTORED: '+portal+' mobile='+mobile);
  page.events.resize();
  await page.flush();
  assert.equal(page.target.children.filter(b=>b.dataset.pb1761Crm===portal).length,1,
   'no duplicate: '+portal+' mobile='+mobile);
  assert(page.requests()>=3);
 }
});
