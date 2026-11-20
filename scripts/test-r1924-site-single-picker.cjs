'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'dist/web/photobridge-r1924-web-single-picker.js'),'utf8');
function harness(native=false){
 const events=new Map();let count=0;
 const add={disabled:false,click(){count++}};
 const form={dataset:{busy:''}};
 const more={textContent:'افزودن عکس',classList:{add(name){more.hiddenClass=name}}};
 const dialog={dataset:{},open:true,isConnected:true,
  querySelector(s){return s==='.pb1139Add'?add:s==='form'?form:null},
  querySelectorAll(s){return s==='.pb1139GroupHead button'?[more]:[]}};
 const document={head:{append(){}},body:{},createElement(){return{}},
  querySelectorAll(){return[dialog]},
  querySelector(s){return s==='dialog.pb1137Intake[open]'?dialog:null},
  addEventListener(name,fn){events.set(name,fn)}};
 const original=async()=>[{name:'a.jpg'}],mover={pick:original};
 const window={pbNativeStorage:native?{}:null,pb1466IntakeMove:mover};
 class HTMLInputElement{
  constructor(){this.type='file';this.files=[{name:'a.jpg'}]}
  matches(){return true}
  closest(){return dialog}
 }
 class MutationObserver{observe(){}}
 vm.runInNewContext(source,{window,document,HTMLInputElement,MutationObserver,requestAnimationFrame:fn=>fn(),setTimeout},{timeout:1000});
 return {events,dialog,more,mover,input:new HTMLInputElement(),get count(){return count}};
}
test('R1924 browser picker automatically adds one selection through the existing verified Add handler',async()=>{
 const h=harness();
 h.events.get('click')({target:{closest:()=>({closest:()=>h.dialog})}});
 await h.mover.pick('select');
 await new Promise(r=>setTimeout(r,10));
 assert.equal(h.count,1);
});
test('R1924 ordinary file chooser adds automatically, group button is visually redundant',async()=>{
 const h=harness();h.events.get('change')({target:h.input});
 await new Promise(r=>setTimeout(r,10));
 assert.equal(h.count,1);
 assert.equal(h.more.hiddenClass,'pb1924RedundantAdd');
});
test('R1924 is never applied to the native Electron renderer',()=>{
 const h=harness(true);assert.equal(h.events.size,0);
});
test('R1924 production page loads the site-only enhancer',()=>{
 const html=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
 assert.match(html,/photobridge-r1924-web-single-picker\.js\?v=r1924/);
 assert.match(source,/window\.pbNativeStorage/);
 assert.doesNotMatch(source,/removeEntry\(|unlink\(|createWritable\(/);
});
