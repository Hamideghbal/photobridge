'use strict';
const {alertContent}=require('./alert-content.cjs');
const infoEvent=n=>['collaboration_request','photographer_invite_accepted','photographer_removed_by_admin','photographer_removed_by_lab'].includes(n?.event_key);
const {collectChatAlerts}=require('./chat-alerts.cjs');
// Pending desktop alerts are account-scoped and survive a restart until acknowledged.
class NativeAlerts {
 constructor({store,request,getAccount,notify,open,isSupported=()=>true,dismiss=()=>{},getUserId=()=>null,notifyInfo=async()=>{},now=()=>Date.now()}){Object.assign(this,{store,request,getAccount,notify,open,isSupported,dismiss,getUserId,notifyInfo,now});this.epoch=0;this.busy=false;this.timer=null;}
 start(){this.stop();void this.poll();this.timer=setInterval(()=>void this.poll(),10000);this.timer.unref?.();}
 stop(){this.epoch++;if(this.timer)clearInterval(this.timer);this.timer=null;this.dismiss();}
 key(account){return 'nativeAlertsPending:'+account;}
 receiptKey(account){return 'nativeAlertsReadOutbox:'+account;}
 acknowledge(account,ids){
  if(this.getAccount()!==account)return;
  const remove=new Set(ids),pending=this.store.get(this.key(account))||[];
  const receipts=new Set(this.store.get(this.receiptKey(account))||[]);
  for(const n of pending)if(remove.has(n.id)&&/^[0-9a-f-]{36}$/i.test(n.id))receipts.add(n.id);
  const chatKey='nativeChatReadOutbox:'+account,chat=this.store.get(chatKey)||[];
  for(const n of pending)if(remove.has(n.id)&&n.id.startsWith('chat:')&&n.chatThread&&!chat.some(x=>x.id===n.id))chat.push({id:n.id,thread:n.chatThread});
  this.store.set(chatKey,chat);
  // Persist the receipt before removing the durable popup, including offline.
  this.store.set(this.receiptKey(account),[...receipts]);
  this.store.set(this.key(account),pending.filter(n=>!remove.has(n.id)));
  void this.flushReceipts(account).catch(()=>{});
 }
 async flushReceipts(account){
  if(this.flushing)return;this.flushing=true;
  try{
   while(this.getAccount()===account){
    const ids=(this.store.get(this.receiptKey(account))||[]).slice(0,200);if(!ids.length)break;
    const r=await this.request('/api/lab/notifications/read',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});
    if(!r.ok||r.status===202)return;const data=await r.json();
    if(this.getAccount()!==account||data?.ok!==true||data.queued||data.operationId)return;
    const sent=new Set(ids);this.store.set(this.receiptKey(account),(this.store.get(this.receiptKey(account))||[]).filter(id=>!sent.has(id)));
   }
   while(this.getAccount()===account){
    const key='nativeChatReadOutbox:'+account,pending=this.store.get(key)||[];if(!pending.length)break;
    const thread=pending[0].thread,items=pending.filter(n=>n.thread===thread).slice(0,200);
    const r=await this.request('/api/lab/notifications/chat-read',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({thread,ids:items.map(n=>n.id.slice(5))})});
    if(!r.ok||r.status===202)return;const data=await r.json();if(this.getAccount()!==account||data.ok!==true||data.queued||data.operationId)return;
    const sent=new Set(items.map(n=>n.id));this.store.set(key,(this.store.get(key)||[]).filter(n=>!sent.has(n.id)));
   }
  }finally{this.flushing=false;}
 }
 async present(account,pending,epoch){
  if(epoch!==this.epoch||this.getAccount()!==account)return;
  if(!pending.length){this.dismiss();return;}
  await this.notify({title:pending.length>1?'PhotoBridge Lab · '+pending.length+' اعلان جدید':String(pending[0].title||'PhotoBridge Lab'),body:pending.slice(0,3).map(n=>String(n.message||n.title||'اعلان جدید')).join(' · '),silent:true,items:pending},()=>this.open(),ids=>this.acknowledge(account,ids),account);
 }
 async poll(){
  const account=this.getAccount();if(this.busy||!account||!this.isSupported())return;
  const epoch=this.epoch,checkedAt=this.now();this.busy=true;
  try{
   await this.flushReceipts(account).catch(()=>{});
   if(epoch!==this.epoch||this.getAccount()!==account)return;
   let pending=this.store.get(this.key(account))||[];

   const response=await this.request('/api/lab/notifications?limit=200&pending='+encodeURIComponent(pending.filter(n=>/^[0-9a-f-]{36}$/i.test(n.id)).slice(0,200).map(n=>n.id).join(',')),{headers:{'x-photobridge-native-info-alerts':'1'}});if(!response.ok){await this.present(account,pending,epoch);return;}
   const data=await response.json();if(epoch!==this.epoch||this.getAccount()!==account)return;let sharedChat={};try{const r=await this.request('/api/lab/notifications/chat-read');if(r.ok)sharedChat=(await r.json()).seen||{};}catch{}
   if(epoch!==this.epoch||this.getAccount()!==account)return;
   const key='nativeAlertsSeen:'+account,seen=new Set(this.store.get(key)||[]);
   const items=Array.isArray(data.notifications)?data.notifications:[];
   const chatWasRead=n=>n.chatThread&&Number(n.chatTime)<=Number(sharedChat[n.chatThread]||0);
   const info=items.filter(infoEvent),infoIds=new Set(info.map(n=>n.id));
   const remotelyRead=new Set([...(data.readIds||[]),...items.filter(n=>n.read_at).map(n=>n.id)]);
   pending=(this.store.get(this.key(account))||[]).filter(n=>!infoIds.has(n.id)&&!infoEvent(n)&&!remotelyRead.has(n.id)&&!chatWasRead(n));
   const removed=pending.length!==(this.store.get(this.key(account))||[]).length;
   this.store.set(this.key(account),pending);if(removed)this.dismiss();
   const deliveredInfo=new Set();
   for(const n of info)if(n.id&&!n.read_at&&!seen.has(n.id)){if(epoch!==this.epoch||this.getAccount()!==account)return;try{await this.notifyInfo(n,account);deliveredInfo.add(n.id)}catch{}}
   const fresh=items.filter(n=>!infoEvent(n)).filter(n=>n.id&&!n.read_at&&!seen.has(n.id)).map(alertContent);
   let chat=null;
   if(this.getUserId())try{chat=await collectChatAlerts({store:this.store,request:this.request,account,userId:this.getUserId(),now:checkedAt});}catch{}
   if(epoch!==this.epoch||this.getAccount()!==account)return;
   if(chat)for(const n of chat.items)if(!seen.has(n.id))fresh.push(n);
   // Re-read after the request: the operator may have acknowledged a popup meanwhile.
   pending=this.store.get(this.key(account))||[];
   if(chat)pending=pending.map(n=>{const current=chat.items.find(x=>x.id===n.id);return current?{...n,chatThread:current.chatThread,chatTime:current.chatTime}:n}).filter(n=>!chatWasRead(n));
   const locallyRead=new Set(this.store.get(this.receiptKey(account))||[]);
   const ids=new Set(pending.map(n=>n.id));
   for(const n of fresh)if(!ids.has(n.id)&&!locallyRead.has(n.id)&&!chatWasRead(n)){pending.push(n);ids.add(n.id);}
   this.store.set(this.key(account),pending);
   for(const n of [...items,...fresh])if(n.id&&(!infoEvent(n)||n.read_at||deliveredInfo.has(n.id)))seen.add(n.id);
   if(chat)this.store.set(chat.key,chat.checkpoint);
   this.store.set(key,[...seen].slice(-1000));
   await this.present(account,pending,epoch);
  }catch{await this.present(account,this.store.get(this.key(account))||[],epoch).catch(()=>{});/* Retry durable orders and messages offline. */}finally{this.busy=false;}
 }
}
module.exports={NativeAlerts};
