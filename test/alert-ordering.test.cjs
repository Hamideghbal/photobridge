'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{AlertWindow}=require('../alert-window.cjs');
test('new batches appear above all unacknowledged alerts without acknowledging or duplicating older ones',async()=>{
 let account='A';const acknowledgements=[];
 class Window extends EventEmitter{constructor(){super();this.webContents=new EventEmitter();this.webContents.setWindowOpenHandler=()=>{};this.webContents.send=()=>{}}loadFile(){return Promise.resolve()}isDestroyed(){return false}show(){}restore(){}focus(){}flashFrame(){}hide(){}}
 const controller=new AlertWindow({BrowserWindow:Window,ipcMain:{handle(){}},store:{get(){return null},set(){}},getAccount:()=>account});
 const present=items=>controller.present({items},null,ids=>acknowledgements.push(ids),account);
 await present([{id:'old'}]);await present([{id:'newest'},{id:'middle'}]);assert.deepEqual(controller.items.map(n=>n.id),['newest','middle','old']);assert.deepEqual(acknowledgements,[]);
 await present([{id:'newest'}]);assert.deepEqual(controller.items.map(n=>n.id),['newest','middle','old']);
 await controller.accept(['middle'],false);assert.deepEqual(acknowledgements,[['middle']]);assert.deepEqual(controller.items.map(n=>n.id),['newest','old']);
 account='B';await present([{id:'other-lab'}]);assert.deepEqual(controller.items.map(n=>n.id),['other-lab']);
});
