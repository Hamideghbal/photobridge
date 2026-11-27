'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const read=p=>fs.readFileSync(p,'utf8');
const root='dist/web/',name='photobridge-r1147-lab-admin-header.js';
test('R2075 preview fallback retains actual subnav, selects correct category, and cleans up when leaving settings',()=>{
 const source=read(root+name),a=source.indexOf('function pb2075SettingsSource('),b=source.indexOf('function secondary(h){',a);
 assert(a>=0&&b>a);
 const categories=[['عمومی','/lab/settings',['general','hours','site','sms','windowsAlert','snappbox']],['عکاسان و همکاری','/lab/settings/customers',['customers','walkin']],['مالی و تعرفه‌ها','/lab/settings/prices',['prices','album','payment','wallet','subscription']],['مسیر ذخیره روی هارد','/lab/settings/local',['local']]];
 const node=()=>{const classes=new Set();return {classList:{contains:x=>classes.has(x),toggle:(x,v)=>v?classes.add(x):classes.delete(x)},children:[],dataset:{},replaceChildren(){this.children=[]},append(x){this.children.push(x)},querySelector(){return this.children[0]||null}}};
 const lab=node(),body=node(),location={pathname:'/lab/settings/sms'},visits=[];
 lab.querySelector=()=>lab.fallback||null;lab.append=x=>{lab.fallback=x;x.remove=()=>{lab.fallback=null}};
 const h={closest:()=>lab},document={body,createElement:node};
 const resolve=new Function('document','location','categories','navigate',source.slice(a,b)+';return pb2075SettingsSource')(document,location,categories,x=>visits.push(x));
 assert.equal(resolve(h,null),null);body.classList.toggle('pbAdminImpersonating',true);
 const tabs=resolve(h,null);assert.equal(tabs.children.length,6);assert(tabs.children.find(x=>x.dataset.section==='sms').classList.contains('active'));
 tabs.children.find(x=>x.dataset.section==='hours').onclick();assert.equal(visits.at(-1),'/lab/settings/hours');
 location.pathname='/lab/settings/prices';assert.equal(resolve(h,null),tabs);assert.equal(tabs.children.length,5);assert(tabs.children[0].classList.contains('active'));
 const live=node();live.append(node());assert.equal(resolve(h,live),live);assert.equal(lab.fallback,null);
 location.pathname='/lab/settings/local';assert.equal(resolve(h,null).children.length,1);
 location.pathname='/lab/orders/flow';assert.equal(resolve(h,null),null);assert.equal(lab.fallback,null);assert(!lab.classList.contains('pb2075SettingsActive'));
});
test('R2075 final website carries matching admin header script, cache key and scoped visibility',()=>{
 const html=read(root+'index.html'),source=read(root+name);
 assert(source.includes("pb2075SettingsSource(h,document.querySelector('.labSettingsSectionTabs'))"));
 assert(html.includes('adminSettings=r2075')&&html.includes('id="pb2075AdminSettingsHeader"'));
 assert(html.includes('body.pbAdminImpersonating #root .labRoleWorkspace.pb2075SettingsActive'));
 assert(!read(root+'lab-desktop-ui/'+name).includes('PB2075 admin preview settings source'));
 for(const [ext,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(root+name+ext))assert(decode(fs.readFileSync(root+name+ext)).equals(fs.readFileSync(root+name)),ext);
});
