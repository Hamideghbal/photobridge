'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const style='photobridge-r1657-photographer-finance-mobile-tab.css';
const script='photobridge-r1657-photographer-mobile-single-tab.js';
const css=fs.readFileSync('scripts/r1657-photographer-finance-mobile-tab.css','utf8');
const js=fs.readFileSync('scripts/r1657-photographer-mobile-single-tab.js','utf8');

test('R1657 hides only photographer embedded finance content heading, not its third header or records',()=>{
 assert.match(css,/html\.pb1126Embedded[\s\S]*?\.financeWorkspace\.financeWorkspaceCompact > \.sectionTopline\.financeTopline\s*\{\s*display:none!important;/);
 assert.doesNotMatch(css,/\.pb1632FinanceTabs\s*\{\s*display:none/);
 assert.doesNotMatch(css,/labRoleWorkspace|\.invoiceRow\s*\{\s*display:none/);
});
test('R1657 centers the single mobile Print\/Album mode without changing multi-tab row',()=>{
 assert.match(css,/@media \(max-width:820px\)/);
 assert.match(css,/\.photographerPrintModeNav\[data-pb1657-single="1"\]/);
 assert.match(css,/justify-content:center!important/);
 assert.doesNotMatch(css,/\.photographerPrintModeNav\s*\{/);
 function run(buttons,expected){
  const nav={children:buttons,dataset:{}};
  const callbacks=[];
  const context={
   window:{
    matchMedia:()=>({matches:true,addEventListener(){}}),
    getComputedStyle:button=>({display:button.display||'block',visibility:'visible'}),
    addEventListener(){}
   },
   document:{readyState:'complete',body:{},querySelectorAll:()=>[nav]},
   MutationObserver:class{observe(){}},
   requestAnimationFrame:fn=>{callbacks.push(fn);return callbacks.length;}
  };
  vm.runInNewContext(js,context);
  callbacks.forEach(fn=>fn());
  assert.equal(nav.dataset.pb1657Single,expected);
 }
 const button=(display='block')=>({
  tagName:'BUTTON',hidden:false,display,getAttribute(){return null;},
  getClientRects(){return display==='none'?[]:[{}];}
 });
 run([button()],'1');
 run([button(),button()],'0');
 run([button(),button('none')],'1');
 run([],'0');
});
test('R1657 build order and web/native files have one asset reference with verified native hashes',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const rollback=build.indexOf("await deployStep('./enable-r1655-restore-photographer-navigation.mjs')");
 const install=build.indexOf("await deployStep('./enable-r1657-photographer-finance-mobile-tab.mjs')");
 assert(rollback>=0&&install>rollback,'new cosmetics must follow the working R1655 navigation');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.equal(html.split('/'+style+'?v=r1657').length-1,1,root);
  assert.equal(fs.readFileSync(root+'/'+style,'utf8'),css,root);
  if(root==='dist/web'){
   assert.equal(html.split('/'+script+'?v=r1657').length-1,1);
   assert.equal(fs.readFileSync(root+'/'+script,'utf8'),js);
  }else{
   const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
   for(const name of ['index.html',style]){
    const entry=manifest.files.find(file=>file.name===name);
    assert(entry,name+' missing from native manifest');
    assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
   }
  }
 }
});
