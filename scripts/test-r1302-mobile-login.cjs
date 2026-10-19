const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('dist/web/photobridge-r1302-mobile-login.js','utf8');
function setup(){
 const values={},classes=new Set(),events={};
 const viewport={height:800,offsetTop:0,scale:1,addEventListener:(name,fn)=>events['viewport:'+name]=fn};
 const root={classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},style:{setProperty:(name,value)=>values[name]=value}};
 const document={documentElement:root,activeElement:null,addEventListener:(name,fn)=>events[name]=fn};
 const window={innerHeight:800,visualViewport:viewport,matchMedia:()=>({matches:true}),addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(source,{window,document,requestAnimationFrame:fn=>fn()});
 return {values,classes,events,viewport,document,window};
}
test('keyboard resize and pan use visible height and top; blur restores normal layout',()=>{
 const s=setup();s.document.activeElement={matches:()=>true,closest:()=>({})};s.events.focusin();
 s.viewport.height=310;s.viewport.offsetTop=42;s.events['viewport:resize']();
 assert.equal(s.values['--pb-login-height'],'310px');assert.equal(s.values['--pb-login-top'],'42px');assert(s.classes.has('pbR1302LoginFocus'));
 s.document.activeElement=null;s.events.focusout();assert(!s.classes.has('pbR1302LoginFocus'));
});
test('dashboard fields and desktop login never activate mobile focus layout',()=>{
 const s=setup();s.document.activeElement={matches:()=>true,closest:()=>null};s.events.focusin();assert.equal(s.classes.size,0);
 s.window.matchMedia=()=>({matches:false});s.document.activeElement.closest=()=>({});s.events.focusin();assert.equal(s.classes.size,0);
});
test('fallback without VisualViewport and pinch zoom retain usable browser dimensions',()=>{
 const s=setup();s.viewport.scale=2;s.viewport.height=200;s.events['viewport:resize']();assert.equal(s.values['--pb-login-height'],'800px');
 s.window.visualViewport=null;s.window.innerHeight=360;s.events.resize();assert.equal(s.values['--pb-login-height'],'360px');
});
test('both login entry points load viewport assets once and keep hidden login rule',()=>{
 for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
  const html=fs.readFileSync(path,'utf8');assert.equal(html.split('/photobridge-r1302-mobile-login.js').length,2);
 }
 assert.match(fs.readFileSync('dist/web/photobridge-r100f89-auth-fit.css','utf8'),/form\.hidden\{display:none!important\}/);
});
