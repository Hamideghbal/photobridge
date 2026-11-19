'use strict';
const path=require('node:path');
const {normalizeSettings,initializeSettings}=require('./alert-settings.cjs');
const {noteComplete,decoratePending,recordVerifiedStages}=require('./alert-order-status.cjs');
class AlertWindow {
 constructor({BrowserWindow,ipcMain,store,getAccount,open,reply=null,retryDownload=null,verifyInvoice=null,getWorkArea=()=>({x:0,y:0,width:1920,height:1080})}){
  Object.assign(this,{BrowserWindow,ipcMain,store,getAccount,open,reply,retryDownload,verifyInvoice,getWorkArea});this.window=null;this.downloads=new Map();this.downloadAccount=null;this.focusOrderId=null;this.items=[];this.account=null;this.ack=null;this.settingsOnly=false;this.hiddenByUser=false;this.replying=new Set();this.revision=0;this.pendingRenderRevision=null;this.invoiceChecks=new Map();
  const valid=event=>this.window&&!this.window.isDestroyed()&&event.sender===this.window.webContents;
  ipcMain.handle('lab-alert-layout',(event,height)=>{if(!valid(event))throw Error('invalid_sender');const area=this.getWorkArea(),h=Math.max(220,Math.min(640,area.height-80,Number(typeof height==='object'?height.height:height)||300)),w=Math.min(420,area.width-40);this.window.setContentSize?.(w,Math.ceil(h));const bounds=this.window.getBounds?.();if(bounds)this.window.setPosition?.(Math.max(area.x+8,area.x+area.width-bounds.width-20),Math.max(area.y+8,area.y+area.height-bounds.height-20));if(height&&typeof height==='object'&&height.revision===this.pendingRenderRevision){this.pendingRenderRevision=null;if(!this.hiddenByUser&&(!this.account||this.account===this.getAccount())&&(this.items.length||this.settingsOnly)){this.window.show();this.window.restore?.();this.window.focus();this.window.flashFrame?.(true)}}return h});
  ipcMain.handle('lab-alert-state',event=>{if(!valid(event))throw Error('invalid_sender');return this.state()});
  ipcMain.handle('lab-alert-save',(event,value)=>{if(!valid(event))throw Error('invalid_sender');initializeSettings(store,this.getAccount()||'default');const settings=normalizeSettings(value);store.set(this.settingsKey(),settings);return settings});
  ipcMain.handle('lab-alert-ack',(event,ids)=>{if(!valid(event))throw Error('invalid_sender');return this.accept(ids,false)});
  ipcMain.handle('lab-alert-reply',(event,value)=>{if(!valid(event))throw Error('invalid_sender');return this.sendReply(value)});
  ipcMain.handle('lab-alert-retry-download',(event,id)=>{if(!valid(event)||event.senderFrame!==this.window.webContents.mainFrame)throw Error('invalid_sender');return this.retryFailedDownload(String(id||''))});
  ipcMain.handle('lab-alert-open',(event,ids)=>{if(!valid(event))throw Error('invalid_sender');return this.accept(ids,true)});
 }
 updateDownload(value,account){
  if(!account||account!==this.getAccount())return;
  if(this.downloadAccount!==account){this.downloads.clear();if(this.account!==account)this.focusOrderId=null;this.downloadAccount=account}
  // Only a confirmed invoice_issued phase (or a post-invoice PDF/print error)
  // may produce an invoice checkmark. A generic download-complete event does not.
  const previous=this.downloads.get(value.orderId);
  const verified=value.downloadVerified===true||previous?.downloadVerified===true;
  const invoiceIssued=value.invoiceIssued===true||value.phase==='invoice_issued'||(value.phase==='failed'&&verified&&['pdf','print'].includes(value.stage))||previous?.invoiceIssued===true;
  // Late progress from an older phase must not undo verified stages. Retain
  // the most advanced non-error phase, while allowing explicit failure/retry.
  const stale=previous?.invoiceIssued===true&&['checking','downloading','verified','invoice_issuing'].includes(value.phase)&&!value.queued;
  value={...value,phase:stale?previous.phase:value.phase,downloadVerified:verified,invoiceIssued,
   orderCreatedAt:value.orderCreatedAt||previous?.orderCreatedAt||null,firstSeenAt:previous?.firstSeenAt||Math.max(Date.now(),(this.lastDownloadSeenAt||0)+1)};
  const stagesChanged=recordVerifiedStages(this.store,account,value);
  const completed=noteComplete(this.store,account,value);this.lastDownloadSeenAt=Math.max(this.lastDownloadSeenAt||0,value.firstSeenAt);this.downloads.delete(value.orderId);this.downloads.set(value.orderId,value);
  while(this.downloads.size>20)this.downloads.delete(this.downloads.keys().next().value);
  if(this.window&&!this.window.isDestroyed()){
   this.window.webContents.send('lab-alert-progress',this.visibleDownloads());
   if(completed||stagesChanged)this.window.webContents.send('lab-alert-change');
  }
  if(value.downloadVerified===true&&!value.invoiceIssued&&['verified','complete','invoice_issuing'].includes(value.phase))this.scheduleInvoiceCheck(value.orderId,account);
 }
 async scheduleInvoiceCheck(id,account){
  if(!this.verifyInvoice||!account||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id||'')))return;
  const key=account+':'+id;if(this.invoiceChecks.has(key))return;
  this.invoiceChecks.set(key,true);
  try{
   for(const delay of [0,1500,4000,8000,15000,30000]){
    if(delay)await new Promise(resolve=>{const timer=setTimeout(resolve,delay);timer.unref?.()});
    if(this.getAccount()!==account||this.downloadAccount!==account)break;
    const current=this.downloads.get(id);
    if(!current||current.invoiceIssued||current.downloadVerified!==true||!['verified','complete','invoice_issuing'].includes(current.phase))break;
    let issued=false;try{issued=await this.verifyInvoice({account,orderId:id})===true}catch{}
    if(!issued)continue;
    const latest=this.downloads.get(id);if(!latest||this.getAccount()!==account||latest.invoiceIssued)break;
    this.updateDownload({...latest,invoiceIssued:true,phase:latest.phase==='complete'?'complete':'invoice_issued',stage:'invoice'},account);
    break;
   }
  }finally{this.invoiceChecks.delete(key)}
 }
 visibleDownloads(){const rows=this.downloadAccount===this.getAccount()?[...this.downloads.values()]:[];/* State remains account-scoped; the renderer correlates each row to its ORIGINAL unread order card by UUID. */return rows.sort((a,b)=>(Date.parse(b.orderCreatedAt)||b.firstSeenAt||0)-(Date.parse(a.orderCreatedAt)||a.firstSeenAt||0)).slice(0,20)}
 settingsKey(){return 'nativeAlertSettings:'+(this.getAccount()||'default');}
 state(){const downloads=this.visibleDownloads(),account=this.getAccount();return {revision:this.revision,downloads,items:decoratePending(this.store,account,this.account===account?this.items:[]),settings:initializeSettings(this.store,account||'default'),settingsOnly:this.settingsOnly};}
 ensure(){
  if(this.window&&!this.window.isDestroyed())return this.window;
  const win=this.window=new this.BrowserWindow({width:420,height:300,minWidth:380,minHeight:240,useContentSize:true,resizable:false,maximizable:false,title:'اعلان‌ها · PhotoBridge Lab',show:false,alwaysOnTop:true,autoHideMenuBar:true,backgroundColor:'#f5f7fb',webPreferences:{preload:path.join(__dirname,'alert-preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,autoplayPolicy:'no-user-gesture-required',backgroundThrottling:false}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
  // Closing the window is NOT "همه را دیدم": keep unread alerts on disk and in memory.
  win.on('close',e=>{e.preventDefault();this.hiddenByUser=true;win.hide();win.flashFrame?.(false)});
  win.once('ready-to-show',()=>{if(this.pendingRenderRevision===null&&!this.hiddenByUser&&(!this.account||this.account===this.getAccount())&&(this.items.length||this.settingsOnly)){win.show();win.focus()}});
  this.ready=win.loadFile(path.join(__dirname,'alert.html')).catch(error=>{if(this.window===win)this.window=null;win.destroy();throw error});
  void this.ready.catch(()=>{});
  return win;
 }
 async present(options,_onOpen,ack,account){
  if(this.getAccount()!==account)return;
  const previous=this.window&&!this.window.isDestroyed()?this.items.map(x=>x.id).join('|'):'';const incoming=options.items||[],current=incoming.find(item=>item.orderId&&item.orderAlert!==false);if(current)this.focusOrderId=current.orderId;const retained=this.account===account?this.items:[],seen=new Set();this.items=[...incoming,...retained].filter(item=>{if(seen.has(item.id))return false;seen.add(item.id);return true});this.account=account;this.ack=ack;this.settingsOnly=false;
  const changed=previous!==this.items.map(x=>x.id).join('|');if(changed){this.hiddenByUser=false;this.revision++;this.pendingRenderRevision=this.revision;}
  const win=this.ensure();if(changed)win.hide?.();await this.ready;if(this.getAccount()!==account||this.window!==win||win.isDestroyed())throw Error('alert_account_changed');if(changed)win.webContents.send('lab-alert-change')
 }
 showSettings(){this.hiddenByUser=false;this.settingsOnly=!this.items.length;const win=this.ensure();this.revision++;this.pendingRenderRevision=this.revision;win.hide?.();void this.ready.then(()=>{if(this.window===win&&!win.isDestroyed())win.webContents.send('lab-alert-change')}).catch(()=>{})}
 async retryFailedDownload(id){
  const account=this.getAccount(),item=this.downloads.get(id);
  if(!account||this.downloadAccount!==account)throw Error('account_changed');
  if(!item||item.phase!=='failed'||item.retrySupported!==true||!this.retryDownload)throw Error('download_retry_unavailable');
  this.updateDownload({...item,phase:'checking',queued:true,reason:''},account);
  try{await this.retryDownload({labId:account,orderId:id,number:item.number});return {accepted:true};}
  catch(error){if(this.getAccount()===account)this.updateDownload(item,account);throw error;}
 }
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
  await this.ack?.(accepted);this.items=this.items.filter(x=>!shown.has(x.id));this.revision++;this.pendingRenderRevision=this.items.length?this.revision:null;
  if(this.window&&!this.window.isDestroyed()){this.window.flashFrame(false);this.window.hide();this.window.webContents.send('lab-alert-change')}
  return true;
 }
 dismiss(){this.revision++;this.pendingRenderRevision=null;this.downloads.clear();this.downloadAccount=null;this.focusOrderId=null;this.items=[];this.ack=null;this.account=null;this.settingsOnly=false;if(this.window&&!this.window.isDestroyed()){this.window.webContents.send('lab-alert-change');this.window.hide();this.window.flashFrame(false)}}
 destroy(){this.window?.destroy();this.window=null;for(const name of ['state','save','ack','open','layout','reply','retry-download'])this.ipcMain.removeHandler('lab-alert-'+name)}
}
module.exports={AlertWindow};
