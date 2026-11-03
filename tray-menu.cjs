'use strict';
const path=require('node:path');
class TrayMenu{
 constructor({BrowserWindow,ipcMain,items,getWorkArea,onError=()=>{}}){Object.assign(this,{BrowserWindow,ipcMain,items,getWorkArea,onError});this.window=null;this.running=false;
  ipcMain.handle('lab-tray-items',event=>{this.validate(event);return items.map((item,id)=>({id,label:item.label||'',separator:item.type==='separator'}))});
  ipcMain.handle('lab-tray-action',async(event,id)=>{this.validate(event);if(!Number.isInteger(id)||!items[id]?.click||this.running) return false;this.running=true;this.window.hide();try{await items[id].click();return true}catch(error){onError(error);return false}finally{this.running=false}});
 }
 validate(event){if(!this.window||this.window.isDestroyed()||event.sender!==this.window.webContents)throw Error('invalid_sender')}
 async popup(bounds){
  let win=this.window;if(!win||win.isDestroyed()){
   win=this.window=new this.BrowserWindow({width:300,height:this.items.length*43+22,frame:false,resizable:false,show:false,skipTaskbar:true,alwaysOnTop:true,backgroundColor:'#ffffff',webPreferences:{preload:path.join(__dirname,'tray-preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false}});
   win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());win.on('blur',()=>win.hide());
   this.ready=win.loadFile(path.join(__dirname,'tray-menu.html'));
  }
  await this.ready;if(win.isDestroyed())return;
  const area=this.getWorkArea(bounds),size=win.getBounds(),x=Math.min(area.x+area.width-size.width,Math.max(area.x,bounds.x+bounds.width-size.width)),y=Math.min(area.y+area.height-size.height,Math.max(area.y,bounds.y-size.height));
  win.setPosition(Math.round(x),Math.round(y));win.show();win.focus();
 }
 destroy(){this.window?.destroy();this.window=null;this.ipcMain.removeHandler('lab-tray-items');this.ipcMain.removeHandler('lab-tray-action')}
}
module.exports={TrayMenu};
