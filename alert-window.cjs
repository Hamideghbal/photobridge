'use strict';
const path=require('node:path');
const {normalizeSettings,initializeSettings}=require('./alert-settings.cjs');
class AlertWindow {
 constructor({BrowserWindow,ipcMain,store,getAccount,open,reply=null,getWorkArea=()=>({x:0,y:0,width:1920,height:1080})}){
  Object.assign(this,{BrowserWindow,ipcMain,store,getAccount,open,reply,getWorkArea});this.window=null;this.downloads=new Map();this.downloadAccount=null;this.items=[];this.account=null;this.ack=null;this.settingsOnly=false;this.hiddenByUser=false;this.replying=new Set();
  const valid=event=>this.window&&!this.window.isDestroyed()&&event.sender===this.window.webContents;
  ipcMain.handle('lab-alert-layout',(event,height)=>{if(!valid(event))throw Error('invalid_sender');const area=this.getWorkArea(),h=Math.max(220,Math.min(640,area.height-80,Number(height)||300)),w=Math.min(420,area.width-40);this.window.setContentSize?.(w,Math.ceil(h));const bounds=this.window.getBounds?.();if(bounds)this.window.setPosition?.(Math.max(area.x+8,area.x+area.width-bounds.width-20),Math.max(area.y+8,area.y+area.height-bounds.height-20));return h});
  ipcMain.handle('lab-alert-state',event=>{if(!valid(event))throw Error('invalid_sender');return this.state()});
  ipcMain.handle('lab-alert-save',(event,value)=>{if(!valid(event))throw Error('invalid_sender');initializeSettings(store,this.getAccount()||'default');const settings=normalizeSettings(value);store.set(this.settingsKey(),settings);return settings});
  ipcMain.handle('lab-alert-ack',(event,ids)=>{if(!valid(event))throw Error('invalid_sender');return this.accept(ids,false)});
  ipcMain.handle('lab-alert-reply',(event,value)=>{if(!valid(event))throw Error('invalid_sender');return this.sendReply(value)});
  ipcMain.handle('lab-alert-open',(event,ids)=>{if(!valid(event))throw Error('invalid_sender');return this.accept(ids,true)});
 }
 updateDownload(value,account){
  if(!account||account!==this.getAccount())return;
  if(this.downloadAccount!==account){this.downloads.clear();this.downloadAccount=account}
  this.downloads.delete(value.orderId);this.downloads.set(value.orderId,value);
  while(this.downloads.size>20)this.downloads.delete(this.downloads.keys().next().value);
  if(this.window&&!this.window.isDestroyed())this.window.webContents.send('lab-alert-progress',[...this.downloads.values()]);
 }
 settingsKey(){return 'nativeAlertSettings:'+(this.getAccount()||'default');}
 state(){const downloads=this.downloadAccount===this.getAccount()?[...this.downloads.values()]:[];return {downloads,items:this.items,settings:initializeSettings(this.store,this.getAccount()||'default'),settingsOnly:this.settingsOnly};}
 ensure(){
  if(this.window&&!this.window.isDestroyed())return this.window;
  const win=this.window=new this.BrowserWindow({width:420,height:300,minWidth:380,minHeight:240,useContentSize:true,resizable:false,maximizable:false,title:'اعلان‌ها · PhotoBridge Lab',show:false,alwaysOnTop:true,autoHideMenuBar:true,backgroundColor:'#f5f7fb',webPreferences:{preload:path.join(__dirname,'alert-preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,autoplayPolicy:'no-user-gesture-required',backgroundThrottling:false}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  win.on('close',e=>{e.preventDefault();this.hiddenByUser=true;win.hide();void this.accept(this.items.map(n=>n.id),false).catch(()=>{})});
  win.once('ready-to-show',()=>{if(!this.hiddenByUser&&(!this.account||this.account===this.getAccount())&&(this.items.length||this.settingsOnly)){win.show();win.focus()}});
  this.ready=win.loadFile(path.join(__dirname,'alert.html')).catch(error=>{if(this.window===win)this.window=null;win.destroy();throw error});
  void this.ready.catch(()=>{});
  return win;
 }
 async present(options,_onOpen,ack,account){
  if(this.getAccount()!==account)return;
  const previous=this.window&&!this.window.isDestroyed()?this.items.map(x=>x.id).join('|'):'';this.items=options.items||[];this.account=account;this.ack=ack;this.settingsOnly=false;
  const win=this.ensure();await this.ready;if(this.getAccount()!==account||this.window!==win||win.isDestroyed())throw Error('alert_account_changed');if(previous!==this.items.map(x=>x.id).join('|')){this.hiddenByUser=false;win.webContents.send('lab-alert-change');win.show();win.restore();win.focus();win.flashFrame(true)}
 }
 showSettings(){this.hiddenByUser=false;this.settingsOnly=!this.items.length;const win=this.ensure();win.webContents.send('lab-alert-change');win.show();win.restore();win.focus();}
 async sendReply(value){
  const account=this.account,id=String(value?.id||''),item=this.items.find(n=>n.id===id);
  if(!account||account!==this.getAccount())throw Error('account_changed');
  if(!item?.replyTo?.customerId||!this.reply)throw Error('reply_not_available');
  const message=String(value?.message||'').trim();if(!message||message.length>4000)throw Error('متن پاسخ باید بین ۱ تا ۴۰۰۰ نویسه باشد.');
  if(this.replying.has(id))throw Error('پاسخ در حال ارسال است.');this.replying.add(id);
  try{await this.reply(item.replyTo.customerId,message,account);if(this.getAccount()!==account||this.account!==account)throw Error('account_changed');await this.accept([id],false);return {sent:true}}finally{this.replying.delete(id)}
 }
 async accept(ids,open){
  if(this.account&&this.account!==this.getAccount()){this.dismiss();return false;}
  const account=this.account;
  if(open)await this.open();
  if(account!==this.account||account!==this.getAccount())return false;
  const shown=new Set(Array.isArray(ids)?ids:[]),accepted=this.items.filter(x=>shown.has(x.id)).map(x=>x.id);
  await this.ack?.(accepted);this.items=this.items.filter(x=>!shown.has(x.id));
  if(this.window&&!this.window.isDestroyed()){this.window.flashFrame(false);if(!this.items.length)this.window.hide();this.window.webContents.send('lab-alert-change')}
  return true;
 }
 dismiss(){this.downloads.clear();this.downloadAccount=null;this.items=[];this.ack=null;this.account=null;this.settingsOnly=false;if(this.window&&!this.window.isDestroyed()){this.window.webContents.send('lab-alert-change');this.window.hide();this.window.flashFrame(false)}}
 destroy(){this.window?.destroy();this.window=null;for(const name of ['state','save','ack','open','layout','reply'])this.ipcMain.removeHandler('lab-alert-'+name)}
}
module.exports={AlertWindow};
