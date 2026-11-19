'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {AlertWindow}=require('../alert-window.cjs');
test('R1912: old acknowledged orders are never painted while a new order is arriving',async()=>{
 const handlers={};const disk=new Map();
 class Window extends EventEmitter{
  constructor(){super();this.visible=false;this.shows=0;this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=()=>{}}
  loadFile(){return Promise.resolve()}isDestroyed(){return false}show(){this.shows++;this.visible=true}hide(){this.visible=false}
  restore(){}focus(){}flashFrame(){}getBounds(){return {x:0,y:0,width:420,height:300}}setContentSize(){}setPosition(){}
 }
 const a=new AlertWindow({BrowserWindow:Window,ipcMain:{handle:(k,v)=>handlers[k]=v},store:{get:k=>disk.get(k),set:(k,v)=>disk.set(k,v)},getAccount:()=> 'lab-a',open:async()=>{}});
 const old={id:'old',title:'Old'},next={id:'next',title:'Next'};
 await a.present({items:[old]},null,async()=>{},'lab-a');
 a.window.emit('ready-to-show');
 assert.equal(a.window.shows,0,'no old/empty first paint');
 const initial=a.state().revision;
 const sender=()=>({sender:a.window.webContents});
 await handlers['lab-alert-layout'](sender(),{revision:initial,height:280});
 assert.equal(a.window.shows,1);
 await a.accept(['old'],false);
 assert.equal(a.state().items.length,0);
 assert.equal(a.window.visible,false);
 await a.present({items:[next]},null,async()=>{},'lab-a');
 assert.deepEqual(a.state().items.map(x=>x.id),['next']);
 const fresh=a.state().revision;
 assert.equal(a.window.shows,1,'window remains hidden until new content is rendered');
 await handlers['lab-alert-layout'](sender(),{revision:initial,height:280});
 assert.equal(a.window.shows,1,'a stale render cannot show the old order');
 await handlers['lab-alert-layout'](sender(),{revision:fresh,height:300});
 assert.equal(a.window.shows,2);
 assert.equal(a.window.visible,true);
});
