'use strict';
// Reuses the application's signed-in session, without a separate pairing token.
class NativeAlerts {
 constructor({store,request,getAccount,notify,open,isSupported=()=>true}){Object.assign(this,{store,request,getAccount,notify,open,isSupported});this.epoch=0;this.busy=false;this.timer=null;}
 start(){this.stop();void this.poll();this.timer=setInterval(()=>void this.poll(),10000);this.timer.unref?.();}
 stop(){this.epoch++;if(this.timer)clearInterval(this.timer);this.timer=null;}
 async poll(){
  const account=this.getAccount();if(this.busy||!account||!this.isSupported())return;
  const epoch=this.epoch;this.busy=true;
  try{
   const response=await this.request('/api/lab/notifications?limit=200');if(!response.ok)return;
   const data=await response.json();if(epoch!==this.epoch||this.getAccount()!==account)return;
   const key='nativeAlertsSeen:'+account,seen=new Set(this.store.get(key)||[]);
   const items=Array.isArray(data.notifications)?data.notifications:[];
   const pending=items.filter(n=>n.id&&!n.read_at&&!seen.has(n.id));if(!pending.length)return;
   const latest=pending[0];
   this.notify({title:pending.length>1?'PhotoBridge Lab · '+pending.length+' اعلان جدید':String(latest.title||'PhotoBridge Lab'),body:pending.length>1?pending.slice(0,3).map(n=>String(n.title||'اعلان جدید')).join(' · '):String(latest.message||''),silent:false},this.open);
   for(const n of items)if(n.id)seen.add(n.id);
   this.store.set(key,[...seen].slice(-1000));
  }catch{/* The next poll retries after offline/server failures. */}finally{this.busy=false;}
 }
}
module.exports={NativeAlerts};
