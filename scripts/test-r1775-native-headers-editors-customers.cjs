'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const native='dist/web/lab-desktop-ui';
const ui=fs.readFileSync(native+'/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync(native+'/photobridge-r1147-lab-admin-header.css','utf8');
const html=fs.readFileSync(native+'/index.html','utf8');
const site=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const nav=fs.readFileSync('dist/web/photobridge-r1761-crm-nav.js','utf8');
const admin=fs.readFileSync('dist/web/photobridge-r1099-photographer-tabs.js','utf8');
const settings=fs.readFileSync('dist/api/photographer-tab-settings.js','utf8');
test('R1775: native order detail hides intake launcher while queue keeps it',()=>{
 const rule=css.slice(css.indexOf('/* PB1775 native order detail launcher guard */'));
 assert(rule.startsWith('/* PB1775'));
 assert(rule.includes('.labRoleWorkspace:has(.orderDetailPage) #pb1137LocalIntakeButton{display:none!important'));
 assert(!rule.includes('.stageQueueWorkspace) #pb1137LocalIntakeButton'));
 assert(!fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8').includes('PB1775 native order detail launcher guard'));
});
test('R1775: native photographer editors are internal dialogs, not browser prompts',()=>{
 assert(ui.includes('function pb1775NativeEditDialog('));
 for(const name of ['PB1755TemporaryNameEdit','PB1769LatinFolderEdit']){
  const a=ui.indexOf('function '+name+'('),b=ui.indexOf('\n}',a);
  assert(a>=0&&b>a&&b-a<5500,name+' function');
  const f=ui.slice(a,b+2);
  assert(f.includes('const answer=await pb1775NativeEditDialog('),name+' uses internal modal');
  assert(!f.includes('const answer=prompt('),name+' should not use browser prompt');
 }
 assert(site.includes('function PB1755TemporaryNameEdit('));
 assert(site.includes('const answer=prompt('),'site behavior must be preserved');
});
test('R1775: actual native dialog can save and cancel, preserving user input',async()=>{
 const a=ui.indexOf('/* PB1775 native internal editor */');
 const fnSrc=ui.slice(a,ui.indexOf('\n}',ui.indexOf('function pb1775NativeEditDialog('))+2);
 assert(a>=0&&fnSrc.includes('function pb1775NativeEditDialog('));
 const nodes=[];
 const make=tag=>{
  const handlers={};
  const node={tagName:tag.toUpperCase(),style:{},children:[],listeners:handlers,open:false,
   setAttribute(){},append(...children){this.children.push(...children)},
   addEventListener(name,handler){handlers[name]=handler},
   remove(){this.removed=true},focus(){},select(){},
   showModal(){this.open=true},close(){this.open=false}};
  nodes.push(node);return node;
 };
 const doc={body:{append(){}},createElement:make};
 const fn=vm.runInNewContext(fnSrc+';pb1775NativeEditDialog',{document:doc});
 const saving=fn('نام لاتین','Old');
 const input=nodes.find(n=>n.tagName==='INPUT');
 input.value='New Studio';
 const form=nodes.find(n=>n.tagName==='FORM');
 form.listeners.submit({preventDefault(){}});
 assert.equal(await saving,'New Studio');
 nodes.length=0;
 const cancelling=fn('نام موقت','قبلی');
 const cancel=nodes.find(n=>n.tagName==='BUTTON'&&n.textContent==='انصراف');
 cancel.listeners.click();
 assert.equal(await cancelling,null);
});
test('R1775: shared Customers navigation is server controlled for both roles and rechecked',()=>{
 assert(nav.includes("const activePortal=()=>lab()?'lab':photo()?'photographer':null"));
 assert(nav.includes("enabled=data?.tabs?.customers===true"));
 assert(nav.includes("if(enabled!==true){clearButtons();return;}"));
 assert(nav.includes("credentials:'include',cache:'no-store'"));
 assert(nav.includes("window.addEventListener('pb1761-customer-settings-updated',refresh)"));
 assert(nav.includes("event.key==='pb1761CustomerVisibilityUpdated'"));
 assert(nav.includes('setInterval(()=>{if(!document.hidden&&activePortal())refresh()},60000)'));
 assert(admin.includes("localStorage.setItem('pb1761CustomerVisibilityUpdated'"));
 assert(admin.includes("window.dispatchEvent(new Event('pb1761-customer-settings-updated'))"));
});
test('R1775: disabled Customers setting handles saved false values and keeps other tabs',()=>{
 const fake=settings.replace(/export\s+/g,'');
 const src=fake.slice(fake.indexOf('function pb1775DisabledCustomerSetting('),fake.indexOf('export async function')>=0?fake.indexOf('export async function'):fake.indexOf('async function handlePhotographerTabSettings('));
 const normalized=vm.runInNewContext(src+';({normalizePhotographerTabs,photographerTabsForUser})');
 for(const off of [false,0,'false','0']){
  assert.equal(normalized.normalizePhotographerTabs({customers:off}).customers,false);
  assert.equal(normalized.photographerTabsForUser({customers:off},{platformRole:'platform_admin'}).tabs.customers,false);
 }
 assert.equal(normalized.normalizePhotographerTabs({customers:true}).customers,true);
 assert.equal(normalized.normalizePhotographerTabs({customers:false,album:true}).album,true);
 assert.equal(normalized.normalizePhotographerTabs({customers:false,instagram:true}).instagram,true);
});
test('R1775: Windows manifest checksums and cache URLs match final payload',()=>{
 const manifest=JSON.parse(fs.readFileSync(native+'/manifest.json','utf8'));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1147-lab-admin-header.css']){
  const entry=manifest.files.find(f=>f.name===name);
  assert(entry,'missing '+name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex'),'hash mismatch '+name);
 }
 assert(html.includes('&nativeEdit=r1775'));
 assert(html.includes('&nativeOrderDetail=r1775'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('photobridge-r1761-crm-nav.js?v=r1775'));
 assert(html.includes('photobridge-r1761-crm-nav.js?v=r1775'));
});
