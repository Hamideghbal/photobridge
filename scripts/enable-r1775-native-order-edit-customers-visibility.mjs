// R1775 final build patch. Windows-only header/editor and authoritative Customers admin toggle.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
function one(s,from,to,label){const n=s.split(from).length-1;if(n!==1)throw Error('[R1775] '+label+' anchor '+n);return s.replace(from,to)}
const native='dist/web/lab-desktop-ui';
if(!fs.existsSync(native+'/index.html'))throw Error('[R1775] Windows Lab UI snapshot missing');
const cssPath=native+'/photobridge-r1147-lab-admin-header.css';
let css=fs.readFileSync(cssPath,'utf8');
const hideRule="\n/* PB1775 native order detail launcher guard */\n@media (min-width:821px){html body #root .labRoleWorkspace:has(.orderDetailPage) #pb1137LocalIntakeButton{display:none!important;visibility:hidden!important;pointer-events:none!important}}\n";
if(!css.includes('PB1775 native order detail launcher guard'))css+=hideRule;
fs.writeFileSync(cssPath,css);
const uiFile=native+'/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1775 native internal editor */')){
 for(const name of ['PB1755TemporaryNameEdit','PB1769LatinFolderEdit']){
  const begin=ui.indexOf('function '+name+'(');
  const end=begin<0?-1:ui.indexOf('\n}',begin);
  if(begin<0||end<begin||end-begin>5500)throw Error('[R1775] '+name+' function missing');
  const previous=ui.slice(begin,end+2);
  const changed=one(previous,'const answer=prompt(','const answer=await pb1775NativeEditDialog(',name+' prompt');
  ui=ui.slice(0,begin)+changed+ui.slice(end+2);
 }
 ui+='\n'+"/* PB1775 native internal editor */\nfunction pb1775NativeEditDialog(title,initial){\n return new Promise(resolve=>{\n  const dlg=document.createElement('dialog');\n  dlg.className='pb1775NativeEditDialog';\n  dlg.setAttribute('dir','rtl');\n  dlg.setAttribute('aria-label',title);\n  dlg.style.cssText='width:min(480px,calc(100vw - 32px));max-width:calc(100vw - 32px);border:1px solid #ccd8e9;border-radius:16px;background:#fff;box-shadow:0 20px 75px #17243a45;padding:24px;font-family:Vazirmatn,Tahoma,sans-serif;color:#22344b;z-index:2147483000';\n  const form=document.createElement('form');\n  form.method='dialog';\n  const heading=document.createElement('h3');\n  heading.textContent=title;\n  heading.style.cssText='font-size:17px;margin:0 0 16px';\n  const field=document.createElement('input');\n  field.type='text';field.value=String(initial??'');\n  field.dir='auto';\n  field.style.cssText='width:100%;box-sizing:border-box;border:1px solid #bdcde3;border-radius:10px;padding:12px;font:inherit;outline-offset:2px';\n  const actions=document.createElement('div');\n  actions.style.cssText='display:flex;gap:10px;justify-content:flex-start;margin-top:18px';\n  const save=document.createElement('button');\n  save.type='submit';save.textContent='ذخیره';\n  save.style.cssText='background:#2363ca;color:#fff;border:0;border-radius:9px;padding:9px 22px;font:inherit;cursor:pointer';\n  const cancel=document.createElement('button');\n  cancel.type='button';cancel.textContent='انصراف';\n  cancel.style.cssText='background:#f6f8fc;color:#344760;border:1px solid #d8e1ec;border-radius:9px;padding:9px 18px;font:inherit;cursor:pointer';\n  actions.append(save,cancel);\n  form.append(heading,field,actions);\n  dlg.append(form);\n  let settled=false;\n  const done=value=>{\n   if(settled)return;\n   settled=true;\n   try{if(dlg.open&&typeof dlg.close==='function')dlg.close()}catch{}\n   dlg.remove();\n   resolve(value);\n  };\n  form.addEventListener('submit',event=>{event.preventDefault();done(field.value)});\n  cancel.addEventListener('click',()=>done(null));\n  dlg.addEventListener('cancel',event=>{event.preventDefault();done(null)});\n  document.body.append(dlg);\n  if(typeof dlg.showModal==='function')dlg.showModal();\n  else{dlg.setAttribute('open','');dlg.style.position='fixed';dlg.style.top='22%';dlg.style.left='50%';dlg.style.transform='translateX(-50%)'}\n  field.focus();field.select();\n });\n}\n"+'\n';
}
fs.writeFileSync(uiFile,ui);
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});
// Nav is shared: keep the server setting authoritative for both roles,
// including open tabs on other devices and the desktop application.
const navPath='dist/web/photobridge-r1761-crm-nav.js';
let nav=fs.readFileSync(navPath,'utf8');
if(!nav.includes('/* PB1775 settings refresh */')){
 nav=one(nav,
  "window.addEventListener('focus',refresh);",
  "/* PB1775 settings refresh */\n    window.addEventListener('focus',refresh);\n    window.addEventListener('pb1761-customer-settings-updated',refresh);\n    window.addEventListener('storage',event=>{if(event.key==='pb1761CustomerVisibilityUpdated')refresh()});\n    if(typeof setInterval==='function')setInterval(()=>{if(!document.hidden&&activePortal())refresh()},60000);",
 'CRM refresh');
}
fs.writeFileSync(navPath,nav);
execFileSync(process.execPath,['--check',navPath],{stdio:'inherit'});
const adminPath='dist/web/photobridge-r1099-photographer-tabs.js';
let admin=fs.readFileSync(adminPath,'utf8');
if(!admin.includes('pb1761CustomerVisibilityUpdated')){
 admin=one(admin,
  "msg.textContent='تنظیمات ذخیره شد.'",
  "msg.textContent='تنظیمات ذخیره شد.';try{localStorage.setItem('pb1761CustomerVisibilityUpdated',String(Date.now()))}catch{}window.dispatchEvent(new Event('pb1761-customer-settings-updated'))",
  'admin save notification');
}
fs.writeFileSync(adminPath,admin);
execFileSync(process.execPath,['--check',adminPath],{stdio:'inherit'});
const tabsPath='dist/api/photographer-tab-settings.js';
let tabs=fs.readFileSync(tabsPath,'utf8');
if(!tabs.includes('function pb1775DisabledCustomerSetting(')){
 tabs=one(tabs,
  "export function normalizePhotographerTabs(value){",
  "function pb1775DisabledCustomerSetting(x){return x===false||x===0||x==='false'||x==='0'}\nexport function normalizePhotographerTabs(value){",
  'tab settings guard');
 tabs=one(tabs,
  "PHOTOGRAPHER_TAB_KEYS.map(key=>[key,value?.[key]!==false])",
  "PHOTOGRAPHER_TAB_KEYS.map(key=>[key,!pb1775DisabledCustomerSetting(value?.[key])])",
  'strict disabled compatibility');
}
fs.writeFileSync(tabsPath,tabs);
execFileSync(process.execPath,['--check',tabsPath],{stdio:'inherit'});
const updated=['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1147-lab-admin-header.css'];
for(const root of ['dist/web',native]){
 const file=root+'/index.html';
 let html=fs.readFileSync(file,'utf8');
 if(html.includes('photobridge-r1761-crm-nav.js?v='))html=html.replace(/photobridge-r1761-crm-nav\.js\?v=[^"\s]+/g,'photobridge-r1761-crm-nav.js?v=r1775');
 if(html.includes('photobridge-r1099-photographer-tabs.js?v='))html=html.replace(/photobridge-r1099-photographer-tabs\.js\?v=[^"\s]+/g,'photobridge-r1099-photographer-tabs.js?v=r1775');
 if(root===native){
  const css=/photobridge-r1147-lab-admin-header\.css\?v=[^"\s]+/g;
  html=html.replace(css,full=>full.includes('r1775')?full:full+'&nativeOrderDetail=r1775');
  const main=/assets\/index-UIRefine-v655-r84\.js\?[^"\s]+/g;
  html=html.replace(main,full=>full.includes('&nativeEdit=r1775')?full:full+'&nativeEdit=r1775');
 }
 fs.writeFileSync(file,html);
 if(root===native){
  if(fs.existsSync(native+'/photobridge-r1761-crm-nav.js'))fs.writeFileSync(native+'/photobridge-r1761-crm-nav.js',nav);
  if(fs.existsSync(native+'/photobridge-r1099-photographer-tabs.js'))fs.writeFileSync(native+'/photobridge-r1099-photographer-tabs.js',admin);
 }
}
const manifestPath=native+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1775] invalid native manifest');
for(const entry of manifest.files){
 const filename=native+'/'+entry.name;
 if(fs.existsSync(filename)&&['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1147-lab-admin-header.css','photobridge-r1761-crm-nav.js','photobridge-r1099-photographer-tabs.js'].includes(entry.name))entry.sha256=hash(fs.readFileSync(filename));
}
manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1775] Windows detail launcher hidden, both native editors inline, Customers setting rechecked across portals.');
