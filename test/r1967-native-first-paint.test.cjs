'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const first=require('../native-first-paint.cjs');
function render(mounted){
 const values=new Set(),els=[],timers=[];
 const doc={readyState:'complete',documentElement:{classList:{add:a=>values.add(a),remove:(...a)=>a.forEach(x=>values.delete(x))}},getElementById:id=>id==='root'?{firstElementChild:mounted?{}:null,querySelector:()=>null}:null,body:{append:x=>els.push(x)},createElement:()=>({style:{},addEventListener(){},remove(){}}),addEventListener(){},querySelector:()=>null};
 const win={matchMedia:()=>({matches:true}),__PB_LAB_DESKTOP_OVERLAY__:true,addEventListener(){},removeEventListener(){}};
 const html=first.injectFirstPaint('<html><head></head><body><div id="root"></div></body></html>');
 const js=html.match(/<script id="pbNativeFirstPaintScript">([\s\S]+?)<\/script>/)?.[1];assert(js);
 vm.runInNewContext(js,{window:win,document:doc,MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame:f=>f(),setInterval:()=>1,clearInterval(){},setTimeout:(f,ms)=>{timers.push({f,ms});return 1},clearTimeout(){},console:{warn(){}},location:{reload(){}}},{timeout:1000});
 return{values,els,timers,win};
}
test('R1967 Windows startup: mounted React app cannot remain hidden if admin header promotion is late',()=>{
 const a=render(true);assert(a.values.has('pbNativeFirstPaintPending'));
 const timer=a.timers.find(x=>x.ms===6500);assert(timer);timer.f();
 assert.equal(a.values.has('pbNativeFirstPaintPending'),false);
 assert.equal(a.win.__PB_NATIVE_FIRST_PAINT_DIAGNOSTICS__.appMounted,true);
});
test('R1967 Windows startup: genuinely unmounted React app does not fake success',()=>{
 const a=render(false);a.timers.find(x=>x.ms===6500).f();
 assert(a.values.has('pbNativeFirstPaintStalled'));
 assert(a.els.some(x=>x.id==='pbNativeFirstPaintDiagnostic'));
 assert.equal(a.win.__PB_NATIVE_FIRST_PAINT_DIAGNOSTICS__.appMounted,false);
});
