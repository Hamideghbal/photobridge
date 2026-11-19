'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {AlertWindow}=require('./r1477-native/alert-window.cjs');

test('R1893: a new notification cannot expose stale rows before the matching render',async()=>{
  const handlers={};
  class FakeWindow {
    constructor(){
      this.shows=0;this.hidden=true;
      this.webContents={on(){},send(){},setWindowOpenHandler(){}};
    }
    isDestroyed(){return false}
    on(){}once(){}loadFile(){return Promise.resolve()}
    show(){this.shows++;this.hidden=false}
    hide(){this.hidden=true}
    restore(){}focus(){}flashFrame(){}
  }
  const manager=new AlertWindow({
    BrowserWindow:FakeWindow,
    ipcMain:{handle:(name,callback)=>{handlers[name]=callback},removeHandler(){}},
    store:{get(){return null},set(){}},
    getAccount:()=> 'lab-one',
    open:async()=>{}
  });
  const order1={id:'order-one'},order2={id:'order-two'};
  const sender=()=>({sender:manager.window.webContents});
  manager.present({items:[order1]},null,async()=>{},'lab-one');
  const first=manager.state().revision;
  assert.equal(manager.window.shows,0);
  await handlers['lab-alert-layout'](sender(),{height:260,revision:first});
  assert.equal(manager.window.shows,1);
  await manager.accept(['order-one'],false);
  assert.equal(manager.window.hidden,true);
  manager.present({items:[order2]},null,async()=>{},'lab-one');
  const second=manager.state().revision;
  assert.notEqual(second,first);
  assert.equal(manager.window.shows,1);
  await handlers['lab-alert-layout'](sender(),{height:260,revision:first});
  assert.equal(manager.window.shows,1,'a stale resize may not reveal old content');
  await handlers['lab-alert-layout'](sender(),{height:260,revision:second});
  assert.equal(manager.window.shows,2);
  assert.deepEqual(manager.state().items,[order2]);
});

test('R1893: renderer layout carries the state revision for paint synchronization',()=>{
  const renderer=fs.readFileSync(path.join(__dirname,'r1476-native/alert-renderer.js'),'utf8');
  assert.match(renderer,/labAlert\.layout\(\{height:.*revision:state\.revision\}\)/);
});
