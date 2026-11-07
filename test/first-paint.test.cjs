'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {injectFirstPaint,readyToReveal}=require('../native-first-paint.cjs');

function fixture({lab=true,header=true,nav=true,second=true,secondSource=true,thirdSource=false,third=true,bridge=true,login=false}={}){
 const mainHeader={
   classList:{contains:className=>header&&className==='pb1147LabAdminHeader'},
   querySelector:selector=>selector==='.pb1147LabNav'?(nav?{}:null):selector==='.settingsIconBtn,.mobileHeaderSettings'?{}:null
 };
 const workspace={querySelector:selector=>{
   if(selector==='.labSingleHeader')return mainHeader;
   if(selector==='.pb1148SecondaryHeader')return second?{}:null;
   if(selector==='.pb1372ThirdHeader')return third?{}:null;
   if(selector==='.labCustomerSubnav,.albumSettingsInnerTabs,.financeSectionTabs,.labPrintPricingCard>.panelHead')return thirdSource?{}:null;
   return null;
 }};
 const root={firstElementChild:{},querySelector:selector=>selector==='.labRoleWorkspace'?(lab?workspace:null):login?{}:null};
 return [{getElementById:()=>root,querySelector:selector=>selector==='.labSettingsSectionTabs,.financeSectionTabs,.mainQueueFilters'?(secondSource?{}:null):null},{__PB_LAB_DESKTOP_OVERLAY__:bridge}];
}
test('gate is inserted before the first page asset and has no network dependency',()=>{
 const html=injectFirstPaint('<html><head><script src="/some-bundle.js"></script></head><body><div id="root"></div></body></html>');
 assert.ok(html.indexOf('id="pbNativeFirstPaintScript"')<html.indexOf('/some-bundle.js'));
 assert.match(html,/html\.pbNativeFirstPaintPending #root/);
 const script=html.match(/<script id="pbNativeFirstPaintScript">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script));
 assert.equal(injectFirstPaint(html),html,'idempotent index injection');
});
test('old main header and half-built navigation must not paint',()=>{
 for(const data of [{header:false},{nav:false},{second:false},{thirdSource:true,third:false},{bridge:false}]){
  assert.equal(readyToReveal(...fixture(data)),false,JSON.stringify(data));
 }
 assert.equal(readyToReveal(...fixture()),true);
 assert.equal(readyToReveal(...fixture({thirdSource:true,third:true})),true);
});
test('archive pages without a second header and login remain available',()=>{
 assert.equal(readyToReveal(...fixture({second:false,secondSource:false})),true);
 assert.equal(readyToReveal(...fixture({lab:false,login:true})),true);
 assert.equal(readyToReveal(...fixture({lab:false,login:false})),false);
});
test('native host injects the gate and successful startup opens only the final UI document',()=>{
 const main=fs.readFileSync(path.join(__dirname,'..','main.cjs'),'utf8');
 const host=fs.readFileSync(path.join(__dirname,'..','host.cjs'),'utf8');
 assert.match(host,/require\('\.\/native-first-paint\.cjs'\)\.injectFirstPaint\(html\)/);
 assert.doesNotMatch(main,/startupPage\(\)\)\);await applyUi\(true\)/);
 assert.match(main,/try\{await applyUi\(true\)\}catch\(error\)/);
 const pkg=require('../package.json'),lock=require('../package-lock.json');
 assert.equal(pkg.version,'1.0.94');assert.equal(lock.version,pkg.version);
 assert.equal(lock.packages[''].version,pkg.version);
});
