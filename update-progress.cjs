'use strict';

const path=require('node:path'),{pathToFileURL}=require('node:url');

class UpdateProgress{
 constructor({BrowserWindow,ipcMain,getParent,onCancel,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),rendererTimeoutMs=10000}){
  this.BrowserWindow=BrowserWindow;this.ipcMain=ipcMain;this.getParent=getParent;this.onCancel=onCancel;this.delay=delay;
  this.rendererTimeoutMs=rendererTimeoutMs;this.window=null;this.state=null;this.resolveAction=null;this.rendererReady=false;this.rendererFailed=false;this.rendererTimer=null;
  this.readyHandler=event=>{if(!this.window||event.sender!==this.window.webContents)return;this.rendererReady=true;clearTimeout(this.rendererTimer);this.rendererTimer=null;this.sendState();this.window.show();this.window.focus?.();};
  this.ipcMain.on('pb-update-progress-ready',this.readyHandler);
  this.actionHandler=(event,action)=>{
   if(!this.window||event.sender!==this.window.webContents||!this.allowed(action))return;
   clearTimeout(this.rendererTimer);this.rendererTimer=null;
   const resolve=this.resolveAction;this.resolveAction=null;resolve?.(action);
  };
  ipcMain.on('pb-update-progress-action',this.actionHandler);
 }
 allowed(action){const state=this.state?.state;return state==='available'?['download','later'].includes(action):state==='ready'?['install','later'].includes(action):state==='error'?['retry','later'].includes(action):false;}
 ensureWindow(){
  if(this.window&&!this.window.isDestroyed())return this.window;
  const parent=this.getParent?.();
  this.rendererReady=false;
  this.window=new this.BrowserWindow({width:520,height:520,minWidth:480,minHeight:480,maxWidth:520,maxHeight:520,parent,modal:!!parent,show:false,resizable:false,minimizable:false,maximizable:false,closable:true,autoHideMenuBar:true,backgroundColor:'#f5f7fb',title:'به‌روزرسانی PhotoBridge',webPreferences:{preload:path.join(__dirname,'update-progress-preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
  const current=this.window;current.removeMenu?.();
  current.webContents.setWindowOpenHandler?.(()=>({action:'deny'}));
  const page=pathToFileURL(path.join(__dirname,'update-progress.html')).href;
  current.webContents.on?.('will-navigate',(event,url)=>{if(url!==page)event.preventDefault();});
  current.on('close',event=>{if(this.window!==current)return;if(this.state?.state==='installing'){event.preventDefault();return;}if(this.state?.state==='downloading')this.onCancel?.();this.resolve('later');});
  current.on('closed',()=>{if(this.window===current){this.window=null;this.rendererReady=false;}});
  current.webContents.on?.('did-finish-load',()=>{if(this.window!==current)return;this.sendState();current.show();current.focus?.();});
  current.webContents.on?.('did-fail-load',(_event,_code,_description,_url,isMainFrame)=>{if(isMainFrame)this.failRenderer(current);});
  void current.loadFile(path.join(__dirname,'update-progress.html')).catch(()=>this.failRenderer(current));
  return current;
 }
 failRenderer(window){if(this.window!==window||this.rendererReady||this.rendererFailed)return;this.rendererFailed=true;clearTimeout(this.rendererTimer);this.rendererTimer=null;this.resolve('ui_unavailable');this.close();}
 resolve(action){const resolve=this.resolveAction;this.resolveAction=null;resolve?.(action);}
 sendState(){if(!this.window||this.window.isDestroyed()||!this.window.webContents.isLoading?.())this.window?.webContents.send?.('pb-update-progress-state',this.state);}
 ask(state){
  this.state={...state};if(this.rendererFailed)return Promise.resolve('ui_unavailable');const answer=new Promise(resolve=>{this.resolveAction=resolve;});
  const win=this.ensureWindow();this.sendState();
  if(!this.rendererReady){clearTimeout(this.rendererTimer);this.rendererTimer=setTimeout(()=>this.failRenderer(win),this.rendererTimeoutMs);this.rendererTimer.unref?.();}
  if(!win.webContents.isLoading?.()){win.show();win.focus?.();}
  return answer;
 }
 update(state){this.state={...state};if(this.rendererFailed)return;this.ensureWindow();this.sendState();}
 async prepareInstall(version){this.update({state:'installing',version});await this.delay(650);}
 close(){clearTimeout(this.rendererTimer);this.rendererTimer=null;this.resolve('later');const win=this.window;this.window=null;if(win&&!win.isDestroyed())win.close();}
 destroy(){this.close();this.ipcMain.removeListener('pb-update-progress-action',this.actionHandler);this.ipcMain.removeListener('pb-update-progress-ready',this.readyHandler);}
}

module.exports={UpdateProgress};
