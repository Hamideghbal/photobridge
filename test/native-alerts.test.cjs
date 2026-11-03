const {test}=require('node:test'),assert=require('node:assert/strict');
const {NativeAlerts}=require('../native-alerts.cjs');
function fixture(){const values=new Map(),shown=[];let account='A';const store={get:k=>values.get(k),set:(k,v)=>values.set(k,structuredClone(v))};const make=()=>new NativeAlerts({store,getAccount:()=>account,request:async()=>{throw Error('offline')},notify:async n=>shown.push(n.items),open:()=>{}});return{store,shown,make,switch:()=>account='B'};}
const item=(id,day)=>({id,title:id,message:id,created_at:'2026-10-'+day+'T12:00:00Z'});
test('newest alert first; previously displayed orders never return with a new batch or after restart',async()=>{const f=fixture(),a=f.make(),old=item('old','01'),newer=item('new','30');await a.present('A',[old],a.epoch);await a.present('A',[old],a.epoch);assert.equal(f.shown.length,1);await a.present('A',[old,newer,item('middle','20')],a.epoch);assert.deepEqual(f.shown[1].map(x=>x.id),['new','middle']);const restarted=f.make();await restarted.present('A',[old,newer],restarted.epoch);assert.equal(f.shown.length,2);});
test('failed popup is retried; another account cannot receive or mark this account alerts',async()=>{const f=fixture(),a=f.make();a.notify=async()=>{throw Error('window_failed')};await assert.rejects(a.present('A',[item('one','01')],a.epoch));assert(!f.store.get('nativeAlertsPresented:A'));a.notify=async n=>f.shown.push(n.items);f.switch();await a.present('A',[item('one','01')],a.epoch);assert.equal(f.shown.length,0);});
test('upgrading migrates previously seen notification IDs so historical orders are not shown again',async()=>{const f=fixture();f.store.set('nativeAlertsSeen:A',['old']);f.store.set('nativeAlertsPending:A',[item('old','01')]);const a=f.make();await a.poll();assert.equal(f.shown.length,0);});
test('acknowledging an older rendered batch cannot consume a newly arrived alert',async()=>{const {AlertWindow}=require('../alert-window.cjs'),handlers=new Map(),f=fixture(),acknowledged=[];const controller=new AlertWindow({store:f.store,ipcMain:{handle:(name,fn)=>handlers.set(name,fn)},getAccount:()=> 'A',open:async()=>{}});const webContents={send(){}},win={webContents,isDestroyed:()=>false,flashFrame(){},hide(){}};controller.window=win;controller.account='A';controller.items=[item('old','01'),item('new','30')];controller.ack=async ids=>acknowledged.push(...ids);await handlers.get('lab-alert-ack')({sender:webContents},['old']);assert.deepEqual(acknowledged,['old']);assert.deepEqual(controller.items.map(x=>x.id),['new']);});
test('new order popup does not wait for a stalled chat check or receipt upload',async()=>{
 const f=fixture();let releaseChat,releaseReceipt;
 f.store.set('nativeAlertsReadOutbox:A',['10000000-0000-4000-8000-000000000001']);
 const a=f.make();a.request=async path=>{
  if(path==='/api/lab/notifications/read')return new Promise(resolve=>releaseReceipt=()=>resolve({ok:true,json:async()=>({ok:true})}));
  if(path.startsWith('/api/lab/notifications?'))return{ok:true,json:async()=>({notifications:[item('new-order','30')]})};
  if(path==='/api/lab/notifications/chat-read')return new Promise(resolve=>releaseChat=()=>resolve({ok:true,json:async()=>({seen:{}})}));
  throw Error('unexpected request');
 };
 const poll=a.poll();for(let i=0;i<10&&!releaseChat;i++)await Promise.resolve();
 assert.equal(f.shown.length,1,'order alarm must already be visible while both unrelated requests remain unresolved');assert.equal(f.shown[0][0].id,'new-order');
 a.request=async path=>{if(path.startsWith('/api/lab/notifications?'))return{ok:true,json:async()=>({notifications:[item('second-order','30')]})};throw Error('chat must remain single-flight')};await a.poll();assert.equal(f.shown.length,2,'another order must arrive even while the earlier chat request remains stalled');
 releaseChat();releaseReceipt();await poll;assert.equal(f.shown.length,2);
});
