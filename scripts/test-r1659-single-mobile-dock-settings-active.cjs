'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
test('R1659 boot marks exactly one final photographer dock without changing buttons',()=>{
 const code=fs.readFileSync('scripts/r1659-photographer-dock-prepaint.js','utf8'),attrs=new Map(),nodes=[];
 function nav(main,lab){let el={classList:{contains:()=>lab},closest:()=>({}),getAttribute:k=>k==='aria-label'?(main?'ناوبری اصلی عکاس':''):attrs.get(el)||null,setAttribute:(_,v)=>attrs.set(el,v),hasAttribute:()=>attrs.has(el),removeAttribute:()=>attrs.delete(el)};return el}
 const a=nav(true,false),b=nav(true,false),lab=nav(false,true);nodes.push(lab,a);
 let observer;const context={window:{matchMedia:()=>({matches:true,addEventListener(){}}),addEventListener(){},pbNativeStorage:false},location:{pathname:'/photographer/orders/flow'},document:{documentElement:{classList:{toggle(){}}},querySelectorAll:()=>nodes},MutationObserver:class{constructor(cb){observer=cb}observe(){}}};
 vm.runInNewContext(code,context);assert.equal(attrs.get(a),'1');assert(!attrs.has(lab));
 nodes.push(b);observer();assert.equal(attrs.get(b),'1');assert(!attrs.has(a));
});
test('R1659 scopes mobile prepaint and Windows selected state correctly',()=>{
 const css=fs.readFileSync('scripts/r1659-single-dock-settings-active.css','utf8');
 assert(css.includes('pb1659PhotographerDock'));
 assert(css.includes('pb1635SettingsOpen'));
 assert(css.includes('.pb1127PrintUtilities'));
 assert(css.includes('.pb1632FinanceTabs'));
 assert(!css.includes('.pb1635SettingsNav>button'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf("await deployStep('./enable-r1659-single-mobile-dock-settings-active.mjs')")>build.indexOf("await deployStep('./enable-r1658-album-compact-three-up.mjs')"));
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal(html.split('id="pb1659DockPrepaint"').length-1,1);
 assert.equal(html.split('singleDock=r1659').length-1,1);
 assert(html.indexOf('pb1659DockPrepaint')<html.indexOf('index-UIRefine-v655-r84.js'));
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const index=fs.readFileSync(root+'/index.html','utf8');
  assert.equal(index.split('photobridge-r1659-single-dock-settings-active.css?v=r1659').length-1,1);
  if(root.endsWith('lab-desktop-ui')){
   const m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
   for(const name of ['index.html','photobridge-r1659-single-dock-settings-active.css']){
    const row=m.files.find(x=>x.name===name);
    assert(row);
    assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
   }
  }
 }
});
