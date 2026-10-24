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
 acknowledge(account,ids){if(this.getAccount()!==account)return;const remove=new Set(ids);this.store.set(this.key(account),(this.store.get(this.key(account))||[]).filter(n=>!remove.has(n.id)));}
 async present(account,pending,epoch){
  if(!pending.length||epoch!==this.epoch||this.getAccount()!==account)return;
  await this.notify({title:pending.length>1?'PhotoBridge Lab · '+pending.length+' اعلان جدید':String(pending[0].title||'PhotoBridge Lab'),body:pending.slice(0,3).map(n=>String(n.message||n.title||'اعلان جدید')).join(' · '),silent:true,items:pending},()=>this.open(),ids=>this.acknowledge(account,ids),account);
 }
 async poll(){
  const account=this.getAccount();if(this.busy||!account||!this.isSupported())return;
  const epoch=this.epoch,checkedAt=this.now();this.busy=true;
  try{
   let pending=this.store.get(this.key(account))||[];

   const response=await this.request('/api/lab/notifications?limit=200',{headers:{'x-photobridge-native-info-alerts':'1'}});if(!response.ok){await this.present(account,pending,epoch);return;}
   const data=await response.json();if(epoch!==this.epoch||this.getAccount()!==account)return;
   const key='nativeAlertsSeen:'+account,seen=new Set(this.store.get(key)||[]);
   const items=Array.isArray(data.notifications)?data.notifications:[];
   const info=items.filter(infoEvent),infoIds=new Set(info.map(n=>n.id));
   pending=(this.store.get(this.key(account))||[]).filter(n=>!infoIds.has(n.id)&&!infoEvent(n));
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
   const ids=new Set(pending.map(n=>n.id));
   for(const n of fresh)if(!ids.has(n.id)){pending.push(n);ids.add(n.id);}
   this.store.set(this.key(account),pending);
   for(const n of [...items,...fresh])if(n.id&&(!infoEvent(n)||n.read_at||deliveredInfo.has(n.id)))seen.add(n.id);
   if(chat)this.store.set(chat.key,chat.checkpoint);
   this.store.set(key,[...seen].slice(-1000));
   await this.present(account,pending,epoch);
  }catch{await this.present(account,this.store.get(this.key(account))||[],epoch).catch(()=>{});/* Retry durable orders and messages offline. */}finally{this.busy=false;}
 }
}
module.exports={NativeAlerts};
