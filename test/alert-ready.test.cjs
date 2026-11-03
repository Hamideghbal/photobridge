'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {AlertWindow}=require('../alert-window.cjs');
test('failed alert renderer load rejects delivery and the same unread batch can retry',async()=>{
 let fail=true,shows=0;const values=new Map();
 class Window extends EventEmitter{constructor(){super();this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=()=>{};this.dead=false}loadFile(){return fail?Promise.reject(Error('renderer_failed')):Promise.resolve()}isDestroyed(){return this.dead}destroy(){this.dead=true}show(){shows++}restore(){}focus(){}flashFrame(){}}
 const controller=new AlertWindow({BrowserWindow:Window,store:{get:k=>values.get(k),set:(k,v)=>values.set(k,v)},ipcMain:{handle(){}},getAccount:()=> 'lab',open:async()=>{}});
 const notice={items:[{id:'order1'}]};await assert.rejects(controller.present(notice,null,()=>{},'lab'),/renderer_failed/);assert.equal(shows,0);
 fail=false;await controller.present(notice,null,()=>{},'lab');assert.equal(shows,1);
});
test('switching account during renderer load cannot display the previous account order',async()=>{
 let resolve,account='a',shows=0;
 class Window extends EventEmitter{constructor(){super();this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=()=>{}}loadFile(){return new Promise(r=>resolve=r)}isDestroyed(){return false}show(){shows++}restore(){}focus(){}flashFrame(){}}
 const controller=new AlertWindow({BrowserWindow:Window,store:{get(){},set(){}},ipcMain:{handle(){}},getAccount:()=>account,open:async()=>{}});
 const pending=controller.present({items:[{id:'order'}]},null,()=>{},'a');account='b';controller.window.emit('ready-to-show');resolve();await assert.rejects(pending,/account_changed/);assert.equal(shows,0);
});
