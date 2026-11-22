'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {NOTE,TTL,MAX,noteComplete,decoratePending}=require('../alert-order-status.cjs');
const {AlertWindow}=require('../alert-window.cjs');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const when=Date.parse('2026-11-19T08:00:00.000Z');
function storage(){const data=new Map();return {get:k=>data.get(k),set:(k,v)=>data.set(k,structuredClone(v)),data}}
function original({id='notice-1',orderId=A,number='896',at=when}={}){
 return{id,title:'سفارش جدید',message:'سفارش #۸۹۶ از عکاس ثبت شد · ۱ فایل',
   orderAlert:true,orderId,orderNumber:number,created_at:new Date(at).toISOString()};
}
test('only an authenticated verified COMPLETE phase annotates the original order; percentage, invoice issued, failure do not',()=>{
 const store=storage(),notice=original();
 for(const phase of ['checking','downloading','verified','invoice_issuing','invoice_issued','failed'])
  assert.equal(noteComplete(store,'lab-a',{orderId:A,number:'896',phase,downloadVerified:true},when+1000),false);
 assert.equal(noteComplete(store,'lab-a',{orderId:A,number:'896',phase:'complete',downloadVerified:false},when+1000),false);
 assert.equal(noteComplete(store,'lab-a',{orderId:A,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:false},when+1000),false);
 assert.equal(noteComplete(store,'lab-a',{orderId:'invalid',number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true},when+1000),false);
 assert(!decoratePending(store,'lab-a',[notice],when+2000)[0].completionNote);
 assert.equal(noteComplete(store,'lab-a',{orderId:A,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true},when+1000),true);
 assert.equal(decoratePending(store,'lab-a',[notice],when+2000)[0].completionNote,NOTE);
 assert.equal(decoratePending(store,'lab-b',[notice],when+2000)[0].completionNote,undefined);
 assert.equal(decoratePending(store,'lab-a',[{...notice,orderAlert:false}],when+2000)[0].completionNote,undefined);
});
test('number-only Persian order alert is correlated unambiguously and never marks another order as done',()=>{
 const store=storage(),notice=original({orderId:null,number:'۸۹۶'});
 noteComplete(store,'lab-a',{orderId:A,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true},when+1000);
 assert.equal(decoratePending(store,'lab-a',[notice],when+2000)[0].completionNote,NOTE);
 assert(!decoratePending(store,'lab-a',[{...notice,orderNumber:'897'}],when+2000)[0].completionNote);
 assert(!decoratePending(store,'lab-a',[{...notice,created_at:new Date(when+500000).toISOString()}],when+500000)[0].completionNote,'older completion must not annotate newer notification');
 noteComplete(store,'lab-a',{orderId:B,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true},when+1100);
 assert(!decoratePending(store,'lab-a',[notice],when+2000)[0].completionNote,'ambiguous duplicate order numbers must never mark done');
 assert.equal(decoratePending(store,'lab-a',[original({orderId:A})],when+2000)[0].completionNote,NOTE,'UUID matching remains exact');
});
test('durable status survives native alert and temporary download list clearing, but retains read acknowledgement behavior',async()=>{
 const store=storage(),changes=[],account=()=> 'lab-a';let acked=[];
 const controller=new AlertWindow({ipcMain:{handle(){}},store,getAccount:account});
 const notice=original();controller.account='lab-a';controller.items=[notice];
 controller.updateDownload({orderId:A,number:'896',phase:'downloading',downloadVerified:false},'lab-a');
 assert(!controller.state().items[0].completionNote);
 controller.updateDownload({orderId:A,number:'896',phase:'invoice_issued',downloadVerified:true},'lab-a');
 controller.updateDownload({orderId:A,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true},'lab-a');
 assert.equal(controller.state().items[0].completionNote,NOTE);
 controller.downloads.clear();assert.equal(controller.state().downloads.length,0);
 assert.equal(controller.state().items[0].completionNote,NOTE,'original order retains success after progress card disappears');
 const fresh=new AlertWindow({ipcMain:{handle(){}},store,getAccount:account});
 fresh.account='lab-a';fresh.items=[notice];
 assert.equal(fresh.state().items[0].completionNote,NOTE,'survives process restart and reloaded unread alert');
 fresh.ack=ids=>{acked=ids};
 fresh.accept=AlertWindow.prototype.accept.bind(fresh);
 await fresh.accept([notice.id],false);
 assert.deepEqual(acked,[notice.id]);
 assert.equal(fresh.state().items.length,0,'operator acknowledgement still removes original notification');
});
test('completion cache is bounded and expired records cannot annotate a newer order',()=>{
 const store=storage(),p=(i)=>({orderId:i,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true});
 for(let i=0;i<MAX+25;i++){const id=i.toString(16).padStart(8,'0')+'-aaaa-4aaa-8aaa-aaaaaaaaaaaa';noteComplete(store,'lab-a',p(id),when+i);}
 assert.equal(store.get('labAlertVerifiedCompleted:lab-a').length,MAX);
 noteComplete(store,'lab-a',p(A),when+1000);
 assert.equal(decoratePending(store,'lab-a',[original({orderId:A})],when+TTL+3000)[0].completionNote,undefined);
});
test('order renderer appends to new-order card without overwriting original text or removing progress semantics',()=>{
 const renderer=fs.readFileSync(path.join(__dirname,'..','alert-renderer.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'..','alert.html'),'utf8');
 assert(renderer.includes("body.textContent=n.message;row.append(title,body);"));
 assert(renderer.includes("orderPanels.set(n.id,{notice:n,panel:stagePanel})"));
 assert(renderer.includes("renderDownloads(next.downloads)"));
 assert(html.includes(".orderStage"));
 assert(renderer.includes("const showBar=item?.phase==='downloading'&&!downloadVerified&&Number(item.totalBytes)>0;"));
 assert(!renderer.includes('root.append(row)'),'an order must not have a second progress card');
});


test('unread new-order notification itself retains verified note beyond cache TTL until operator acknowledgment',async()=>{
 const store=storage(),pendingKey='nativeAlertsPending:lab-a',notice=original();
 store.set(pendingKey,[notice]);
 assert(noteComplete(store,'lab-a',{orderId:A,number:'896',phase:'complete',downloadVerified:true,invoiceIssued:true},when+1500));
 const saved=store.get(pendingKey);
 assert.equal(saved[0].completionNote,NOTE,'success must be saved in the ORIGINAL unread alert, not only a transient progress event');
 assert.equal(decoratePending(store,'lab-a',saved,when+TTL+6*24*60*60*1000)[0].completionNote,NOTE,'unread order remains completed long after transient cache expires');
 const controller=new AlertWindow({ipcMain:{handle(){}},store,getAccount:()=> 'lab-a'});
 controller.account='lab-a';controller.items=saved;
 assert.equal(controller.state().items[0].completionNote,NOTE);
 const {NativeAlerts}=require('../native-alerts.cjs');
 const alerts=new NativeAlerts({store,request:async()=>({ok:true,json:async()=>({ok:true})}),getAccount:()=> 'lab-a',notify:async()=>{},open:async()=>{}});
 alerts.acknowledge('lab-a',[notice.id]);
 assert.equal(store.get(pendingKey).length,0,'only explicit operator acknowledgment removes durable notice');
});

test('the unread card keeps each verified check independently after later updates and progress eviction',()=>{
 const store=storage(),account='lab-a',notice=original({at:Date.now()-1000});
 store.set('nativeAlertsPending:'+account,[notice]);
 const controller=new AlertWindow({ipcMain:{handle(){}},store,getAccount:()=>account});
 controller.account=account;controller.items=[notice];
 controller.updateDownload({orderId:A,number:'896',phase:'verified',downloadVerified:true},account);
 controller.updateDownload({orderId:A,number:'896',phase:'checking',downloadVerified:false},account);
 for(let i=0;i<25;i++)controller.updateDownload({orderId:'other-'+i,phase:'downloading'},account);
 assert.equal(controller.downloads.has(A),false);
 assert.equal(controller.state().items[0].downloadVerified,true);
 assert.equal(controller.state().items[0].invoiceIssued,false);
 controller.updateDownload({orderId:A,number:'896',phase:'invoice_issued',downloadVerified:true},account);
 const persisted=store.get('nativeAlertsPending:'+account)[0];
 assert.equal(persisted.invoiceIssued,true);
 assert.equal(persisted.downloadVerified,true);
 assert(!persisted.completionNote,'invoice is independent of PDF and print completion');
 assert.equal(decoratePending(store,account,[persisted],Date.now()+TTL+1000)[0].downloadVerified,true);
});
