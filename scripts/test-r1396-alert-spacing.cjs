const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/web/photobridge-r1363-lab-queue.js','utf8');
function fixture({third=0,height=64,notice=true}={}){
 const frame=[],listeners={},values={},rootValues={},observed=[];let currentNotice=notice;
 const style=target=>({getPropertyValue:key=>target[key]||'',setProperty:(key,value)=>target[key]=value});
 const node=(bottom,h=44)=>({getClientRects:()=>[{}],getBoundingClientRect:()=>({bottom,height:h})});
 const headers=[node(72),node(120)];if(third)headers.push(node(third));const alert=node(0);alert.getBoundingClientRect=()=>({height});
 const root={style:style(rootValues),querySelectorAll:selector=>{assert(selector.includes('.pb1372ThirdHeader'));return headers},querySelector:()=>currentNotice?alert:null};
 const main={querySelector:()=>({}),closest:()=>root,style:style(values)};
 const context={window:{},document:{readyState:'complete',querySelector:()=>main,documentElement:{classList:{toggle(){}}},getElementById:()=>({}),body:{}},matchMedia:()=>({matches:true,addEventListener(){}}),getComputedStyle:()=>({visibility:'visible'}),innerHeight:900,requestAnimationFrame:fn=>frame.push(fn),addEventListener:(key,fn)=>listeners[key]=fn,MutationObserver:class{observe(){}},ResizeObserver:class{constructor(fn){listeners.resizeObserver=fn}disconnect(){observed.length=0}observe(n){observed.push(n)}}};
 vm.runInNewContext(source,context);const flush=()=>{let count=0;while(frame.length){assert(count++<10);frame.shift()()}};flush();
 return {values,rootValues,observed,headers,alert,resize:()=>{listeners.resize();flush()},wrap:n=>{height=n;listeners.resizeObserver();flush()},dismiss:()=>{currentNotice=false;listeners.resize();flush()}};
}
test('two-header pages reserve the notice height instead of covering their text',()=>{const f=fixture();assert.equal(f.rootValues['--pb1396-alert-top'],'128px');assert.equal(f.values['--pb1363-order-top'],'200px');assert(f.observed.includes(f.alert))});
test('three-header customer and finance pages place content below the whole notice',()=>{for(const edge of [164,184]){const f=fixture({third:edge});assert.equal(f.rootValues['--pb1396-alert-top'],edge+8+'px');assert.equal(f.values['--pb1363-order-top'],edge+80+'px')}});
test('wrapped multiline messages dynamically reserve their new height',()=>{const f=fixture({third:164});f.wrap(110);assert.equal(f.values['--pb1363-order-top'],'290px')});
test('dismissal and pages without a notice leave no empty notice space',()=>{const f=fixture({third:164});f.dismiss();assert.equal(f.values['--pb1363-order-top'],'164px');assert(!f.observed.includes(f.alert));assert.equal(fixture({notice:false}).values['--pb1363-order-top'],'120px')});
test('third header no longer races the scroll owner by overwriting the content edge',()=>{const s=fs.readFileSync('dist/web/photobridge-r1372-third-header.js','utf8');assert(!s.includes("setProperty('--pb1363-order-top'"));const css=fs.readFileSync('dist/web/photobridge-r1363-lab-queue.css','utf8');assert(css.includes('top:var(--pb1396-alert-top,128px)'));assert(css.includes('.labCollaborationAlert'))});
