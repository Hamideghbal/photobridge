'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.css','utf8');
const landing=fs.readFileSync('dist/web/photobridge-r1099-photographer-tabs.js','utf8');
const chooser=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');

function navigateFunction(){
 const begin=nav.indexOf('function navigate(key){');
 const end=nav.indexOf('\n }\n // Register before legacy',begin);
 assert(begin>=0&&end>begin,'desktop navigation handler preserved');
 return nav.slice(begin,end+3);
}

test('R1997: Gallery is a real, isolated, cached document and Print cannot redirect it',()=>{
 assert.doesNotThrow(()=>new vm.Script(nav),'runtime syntax valid');
 assert.match(nav,/if\(key==='gallery'\)\{frame\.src='\/photographer\/gallery\?pbDesktopContent=1&pbDesktopPanel=gallery';\}/);
 assert.match(nav,/if\(key==='store'\|\|key==='gallery'\)\{\s*\/\/ Keep the selected storefront\/gallery document; never reset Store to chooser\.\s*open\(key\);return;/);
 assert.equal(nav.includes("if(key==='print'||key==='crm'||key==='calendar'){open(key);return;}"),false,'legacy Print shortcut must not intercept');
 assert.equal(nav.includes('pb1978Refresh'),false,'repeated Print click must not hard-reload its embedded document');
 assert.match(nav,/if\(\['store','print','crm','calendar','gallery'\]\.includes\(panel\)\)open\(panel,false\)/,'reload/back restores Gallery');
 assert.match(landing,/!.*\['pbDesktopPanel','pbCrmTab','pbStorePanel','pbDesktopContent','view'\]/,'explicit Gallery iframe bypasses first-login Print redirect');
 assert.match(chooser,/q\.get\('pbDesktopPanel'\)!=='print'/,'Lab chooser must disappear for Gallery/Store');
});
test('R1997: switching Gallery/Store never recreates Print or navigates the root',()=>{
 const code=navigateFunction();
 const opens=[],navigations=[],clears=[];
 const frame={isConnected:true,contentDocument:{body:{}},contentWindow:{location:{href:'https://photobridge.ir/photographer/orders/flow'}},addEventListener(){}};
 const panel={hidden:false,querySelector:()=>frame};
 const factory=new Function('tabs','sessionStorage','window','closePanels','open','selected','panels','openPrintChooser','schedule','location','return ('+code+')');
 const navFn=factory([['ai','هوش مصنوعی','/photographer/ai/retouch']],{setItem(){}},
  {location:{assign:u=>navigations.push(u)}},()=>clears.push(1),key=>opens.push(key),null,new Map([['print',panel]]),
  ()=>true,()=>{}, {pathname:'/photographer/orders'});
 navFn('gallery');navFn('store');navFn('gallery');navFn('print');navFn('ai');
 assert.deepEqual(opens,['gallery','store','gallery','print']);
 assert.deepEqual(navigations,['/photographer/ai/retouch']);
 assert.equal(clears.length,1,'only unrelated full-document pages close the panel cache');
});
test('R1997: Store controls keep stable identity and synchronize selection without DOM reconstruction',()=>{
 assert.match(nav,/function pb1997StoreKey\(el\)/);
 assert.match(nav,/function pb1997LiveStoreControl\(doc,key\)/);
 assert.match(nav,/function pb1997SyncStoreHeader\(row,controls,doc\)/);
 assert.match(nav,/headerControls\.map\(el=>pb1997StoreKey\(el\)\)\.join\('\|'\)\+pb1997StoreKey\(cameraCart\)/);
 assert.match(nav,/copy\.dataset\.pb1997StoreKey=pb1997StoreKey\(original\)/);
 assert.match(nav,/pb1997LiveStoreControl\(doc,copy\.dataset\.pb1997StoreKey\)/);
 assert.match(nav,/if\(storeHeader&&!choosing\)pb1997SyncStoreHeader\(row,headerControls,doc\)/);
 assert.doesNotMatch(navigateFunction(),/openStoreChooser\(/,'Store must retain its selected page instead of forcibly reopening chooser');
});
test('R1997: hidden frames do not keep redrawing Store header; CSS prevents row collisions',()=>{
 assert.match(nav,/new MutationObserver\(\(\)=>\{if\(selected===key&&!panel\.hidden\)schedule\(\);\}\)/);
 assert.match(css,/\/\* PB1997 resilient Store secondary grid \*\//);
 assert.match(css,/grid-template-columns:minmax\(100px,1fr\) minmax\(120px,auto\) minmax\(230px,1fr\)!important/);
 assert.match(css,/\.pb1126FrameStoreTabs\{\s*position:static!important/);
 assert.match(css,/\.pb1126FrameStoreCart\{\s*position:static!important/);
 assert.match(css,/\.pb1126FrameStoreTitle\{\s*position:static!important/);
});
