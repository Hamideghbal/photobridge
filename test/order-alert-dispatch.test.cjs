'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {alertContent,orderNotice}=require('../alert-content.cjs');
const {createOrderAlertDispatch}=require('../order-alert-dispatch.cjs');
const UUID='44444444-4444-4444-8444-444444444444',OTHER='55555555-5555-4555-8555-555555555555';
const NOW=Date.parse('2026-11-19T07:25:00Z');
const photo894={id:'notification-894',title:'سفارش جدید',event_key:'legacy_lab_order',message:'سفارش #۸۹۴ از Platform Admin ثبت شد · ۱ فایل',created_at:new Date(NOW).toISOString()};
test('realistic photo: legacy notification has order number, not UUID; still qualifies for direct download',()=>{
 const value=alertContent(photo894);
 assert.equal(value.orderAlert,true);
 assert.equal(value.orderNumber,'894');
 assert.equal(value.orderId,null);
 assert.equal(orderNotice({...photo894,message:'سفارش #٨٩٤ از Platform Admin ثبت شد - ١ فایل'}).orderNumber,'894');
 assert.equal(orderNotice({title:'صدور فاکتور',message:'فاکتور شماره #۸۹۴ صادر شد'}),null);
});
test('the instant the popup notice is received, resolve its number without waiting for 45-second worker scan',async()=>{
 const requests=[],sent=[],logs=[];
 const dispatch=createOrderAlertDispatch({
  getAccount:()=> 'lab-A',now:()=>NOW,
  deliver:(lab,id)=>sent.push({lab,id}),
  request:async(path)=>{requests.push(path);return {ok:true,json:async()=>({orders:[{id:UUID,lab_id:'lab-A',number:894,status:'sent',file_count:1,downloaded_at:null}]})}},
  log:(stage,data)=>logs.push(stage)
 });
 dispatch.accept('lab-A',[photo894]);
 assert.deepEqual(requests,['/api/lab/orders'],'resolve starts synchronously, not 45s after popup');
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(sent,[{lab:'lab-A',id:UUID}]);
 assert(logs.includes('number_resolved'));
 dispatch.accept('lab-A',[photo894]);await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests.length,1,'no duplicate fetch for the same notice');
});
test('existing notification with a valid UUID bypasses any order list request',()=>{
 let requested=0;const sent=[];
 const dispatch=createOrderAlertDispatch({getAccount:()=> 'lab-A',now:()=>NOW,
 request:()=>{requested++;return Promise.reject(Error('unexpected request'))},
 deliver:(lab,id)=>sent.push(id)});
 dispatch.accept('lab-A',[{...photo894,event_key:'order_submitted',metadata:{orderId:UUID}}]);
 assert.deepEqual(sent,[UUID]);assert.equal(requested,0);
});
test('safe correlation requires unique active order of same lab; no match is not a download',async()=>{
 const sent=[],calls=[];
 const dispatch=createOrderAlertDispatch({getAccount:()=> 'lab-A',now:()=>NOW,
  request:async()=>({ok:true,json:async()=>({orders:[
   {id:UUID,lab_id:'lab-other',number:894,status:'sent'},
   {id:OTHER,lab_id:'lab-A',number:894,status:'completed'}
  ]})}),
  deliver:(lab,id)=>sent.push(id),
  log:(stage)=>calls.push(stage)
 });
 // Keep this test immediate by checking the first resolver cycle. Remaining
 // bounded retries are legitimate when an upload is not yet committed.
 dispatch.accept('lab-A',[photo894]);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(sent.length,0);
 assert(calls.includes('number_detected'));
 dispatch.reset();
});
test('do not follow old/unread history, different lab, or unrelated finance alerts',async()=>{
 const sent=[];let requested=0;
 const d=createOrderAlertDispatch({getAccount:()=> 'lab-A',now:()=>NOW,
 request:async()=>{requested++;return {ok:true,json:async()=>({orders:[]})}},
 deliver:(lab,id)=>sent.push(id)});
 d.accept('lab-other',[photo894]);
 d.accept('lab-A',[{...photo894,created_at:new Date(NOW-30*60000).toISOString()}]);
 d.accept('lab-A',[{title:'فاکتور',event_key:'invoice_issued',message:'فاکتور شماره ۸۹۴ صادر شد',id:'finance'}]);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requested,0);assert.equal(sent.length,0);
});
test('native alert pipeline dispatches exact order before awaiting popup and chat',()=>{
 const source=fs.readFileSync(path.join(__dirname,'..','native-alerts.cjs'),'utf8');
 const dispatchAt=source.indexOf('this.onOrderNotice(account,justArrived)');
 const popupAt=source.indexOf('await this.present(account,orderPending,epoch)');
 assert(dispatchAt>0&&popupAt>dispatchAt);
 const main=fs.readFileSync(path.join(__dirname,'..','main.cjs'),'utf8');
 assert(main.includes("createOrderAlertDispatch"));
 assert(main.includes("onOrderNotice:(account,items)=>orderDispatch.accept(account,items)"));
 assert(main.includes("orderDispatch.accept(account,message?.items||[])"));
});


test('real NativeAlerts poll begins order lookup before popup is presented',async()=>{
 const {NativeAlerts}=require('../native-alerts.cjs');
 const values=new Map(),sequence=[],orders=[{id:UUID,lab_id:'lab-A',number:894,status:'sent',file_count:1}];
 const store={get:key=>values.get(key),set:(key,v)=>values.set(key,structuredClone(v))};
 let orderQueryStarted=false;
 const request=async route=>{
  if(route.startsWith('/api/lab/notifications?'))return {ok:true,json:async()=>({notifications:[photo894]})};
  if(route==='/api/lab/orders'){orderQueryStarted=true;sequence.push('order_fetch');return {ok:true,json:async()=>({orders})}};
  if(route==='/api/lab/notifications/chat-read')return {ok:true,json:async()=>({seen:{}})};
  return {ok:true,json:async()=>({ok:true})};
 };
 const sent=[];
 const dispatch=createOrderAlertDispatch({getAccount:()=> 'lab-A',request,now:()=>NOW,deliver:(a,id)=>{sent.push(id);sequence.push('order_dispatched')}});
 const alerts=new NativeAlerts({store,request,getAccount:()=> 'lab-A',getUserId:()=>null,
  onOrderNotice:(a,items)=>dispatch.accept(a,items),
  notify:async()=>{sequence.push('popup');assert(orderQueryStarted,'order resolver must already have started before opening the popup')},
  open:()=>{}});
 await alerts.poll();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(sent,[UUID]);
 assert(sequence.indexOf('order_fetch')<sequence.indexOf('popup'));
});
