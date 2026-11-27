'use strict';
// Account-scoped popup queue, independent of the Lab and of the old Store booking toast.
class StoreAlerts {
 constructor({store,request,getAccount,present,dismiss,interval=5000}){Object.assign(this,{store,request,getAccount,present,dismiss,interval});this.epoch=0;this.flight=null;this.timer=null}
 key(account,kind){return 'pb2095StoreAlerts:'+kind+':'+account}
 start(){this.stop();void this.poll();this.timer=setInterval(()=>void this.poll(),this.interval);this.timer.unref?.()}
 stop(){this.epoch++;clearInterval(this.timer);this.timer=null;this.dismiss()}
 async acknowledge(account,ids){if(this.getAccount()!==account)return false;const key=this.key(account,'pending'),out=this.key(account,'ack'),shown=new Set(ids),pending=this.store.get(key)||[];this.store.set(out,[...new Set([...(this.store.get(out)||[]),...pending.filter(n=>shown.has(n.id)).map(n=>n.id)])]);this.store.set(key,pending.filter(n=>!shown.has(n.id)));void this.poll();return true}
 poll(){if(this.flight)return this.flight;this.flight=this.run().finally(()=>this.flight=null);return this.flight}
 async run(){
  const account=this.getAccount(),epoch=this.epoch;if(!account){this.dismiss();return}const same=()=>account===this.getAccount()&&epoch===this.epoch,key=this.key(account,'pending'),out=this.key(account,'ack');
  try{
   const ids=(this.store.get(out)||[]).slice(0,200);
   if(ids.length){const r=await this.request('/api/rental/notifications/desktop/read',{method:'POST',body:JSON.stringify({ids})});if(!same())return;if(r.ok&&(await r.json()).ok===true&&same()){const sent=new Set(ids);this.store.set(out,(this.store.get(out)||[]).filter(id=>!sent.has(id)))}}
   if(!same())return;
   const r=await this.request('/api/rental/notifications/desktop?limit=200');if(!same())return;
   if(r.status===401||r.status===403){this.store.set(key,[]);this.dismiss();return}
   if(r.ok){const d=await r.json();if(!same())return;if(String(d.shopId)!==String(account.split(':')[0])){this.dismiss();return}const local=new Set(this.store.get(out)||[]),pending=(d.notifications||[]).filter(n=>typeof n.id==='string'&&!local.has(n.id)).map(n=>({id:n.id,title:String(n.title||'اعلان فروشگاه'),message:String(n.message||''),target:n.target}));this.store.set(key,pending)}
  }catch{/* Persist unread alerts across a temporary offline interval. */}
  if(!same())return;const pending=this.store.get(key)||[];if(!pending.length){this.dismiss('empty');return}await this.present({items:pending},null,ids=>this.acknowledge(account,ids),account)
 }
}
module.exports={StoreAlerts};
