'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=fs.readFileSync('dist/api/server.js','utf8');
const automation=fs.readFileSync('dist/api/lab-auto-processing.js','utf8');
const managerStart=api.indexOf('function pb1962LabManagerEventInfo(');
const managerEnd=api.indexOf('\nfunction publishCustomerEvent(',managerStart);
assert(managerStart>0&&managerEnd>managerStart,'manager event module installed');
const managerSource=api.slice(managerStart,managerEnd);
const id='11111111-1111-4111-8111-111111111111',orderId='22222222-2222-4222-8222-222222222222';
const ctx=vm.createContext({console,Map,Set,JSON,Date,Promise,Number,String,Object});
vm.runInContext(managerSource,ctx);
const details=(event,extra={})=>ctx.pb1962LabManagerEventInfo(event,{orderId,mode:'print',number:42,...extra});
test('R1965: print and album downloads notify only after verified receipt and use one dedupe key',()=>{
 const print=details('download_verified');
 const album=details('download_verified',{mode:'album'});
 const previous=details('order_status',{status:'downloaded'});
 assert.equal(print.dedupeKey,album.dedupeKey);
 assert.equal(print.dedupeKey,previous.dedupeKey);
 assert.match(print.title,/دانلود عکس/);
 assert.match(album.title,/دانلود آلبوم/);
 assert.equal(details('order_status',{status:'sent',updatedAt:new Date().toISOString()}),null);
});
test('R1965: new manager records are mobile-only, no Windows SSE duplication',async()=>{
 const entries=[],notifications=[],sse=[];
 ctx.pool={connect:async()=>({query:async(sql,args=[])=>{
  if(sql.startsWith('INSERT INTO system_notifications')){
   entries.push({sql,args});
   return {rows:[{id:'33333333-3333-4333-8333-333333333333',title:args[2],message:args[3]}]};
  }
  return {rows:[]};
 },release:()=>{}})};
 ctx.sendWebPushToRecipient=async(kind,receiver,row,event)=>{notifications.push({kind,receiver,event});return{accepted:1}};
 ctx.labEventClients=new Map([[id,[{write:()=>sse.push('bad')}]]]);
 assert.equal(await ctx.pb1962LabManagerNotify(id,'download_verified',{orderId,mode:'print',number:42}),true);
 await Promise.resolve();
 assert.equal(entries.length,1);
 const metadata=JSON.parse(entries[0].args[4]);
 assert.equal(metadata.pbManagerMobileOnly,true);
 assert.equal(notifications[0].kind,'lab');
 assert.equal(notifications[0].receiver,id);
 assert.equal(sse.length,0,'no manager_order_event injected in Windows SSE');
});
test('R1965: lab manager Web Push subscription filter chooses Android/iOS, not Windows',()=>{
 assert.match(api,/web_push_subscriptions\.user_agent ~\* '\(Android\|iPhone\|iPad\|iPod\|Mobile\)'/);
 assert.match(api,/FROM lab_manager_push_owners p JOIN lab_memberships m/);
 assert.match(api,/m\.role='lab_admin'/);
});
test('R1965: desktop Lab notification list hides old and new manager events',()=>{
 const start=api.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/notifications')"),
       end=api.indexOf("if (req.method === 'GET' && url.pathname === '/api/lab/events')",start);
 assert(start>0&&end>start);
 const part=api.slice(start,end);
 assert.match(part,/managerMobile = \/Android\|iPhone\|iPad\|iPod\|Mobile\/i/);
 assert.match(part,/event_key NOT LIKE 'lab_manager_%'/);
 assert.match(part,/pbManagerMobileOnly/);
 assert.match(part,/ORDER BY created_at DESC LIMIT \$3/);
 assert.match(part,/\[labId, managerMobile, limit\]/);
 assert.match(part,/id=ANY\(\$2::uuid\[\]\).*\$3::boolean/);
 assert(!part.includes('manager_order_event'));
});
test('R1965: receipt triggers mobile notice post-commit, never at start or when incomplete',()=>{
 const i=api.indexOf('const labDownloadReceipt=url.pathname.match(');
 const j=api.indexOf('const labOrderDownloadCheck = url.pathname.match(',i);
 assert(i>0&&j>i);
 const part=api.slice(i,j);
 assert(part.indexOf('await acknowledgeLabDownload(')>=0);
 assert(part.indexOf("pb1962LabManagerNotify(labId,'download_verified'")>part.indexOf('await acknowledgeLabDownload('));
 assert.match(part,/if\(result\.invoice\?\.id\)void pb1962LabManagerNotify\(labId,'invoice_created'/);
});
test('R1965: invoice automation only notifies after first committed invoice',()=>{
 assert.match(api,/onInvoiceCreated:\(lab,order,invoice\)=>pb1962LabManagerNotify/);
 assert.match(automation,/if\(!wasExisting&&invoice\?\.id\)await onInvoiceCreated/);
 assert.match(automation,/await c\.query\('COMMIT'\)/);
});
test('R1965: installed Windows Lab notification UI and download progress remain unchanged',()=>{
 assert.match(api,/PB1965 MANAGER MOBILE ONLY/);
 assert(fs.existsSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js'));
 assert(fs.existsSync('apps/lab-desktop/native-alerts.cjs'));
});
