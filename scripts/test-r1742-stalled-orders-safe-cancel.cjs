'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');

test('server cancellation extends only to stuck pre-print sent/received orders',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const begin=server.indexOf("if (labOrder && req.method === 'DELETE')");
 const end=server.indexOf("if (labOrder && req.method === 'PATCH')",begin);
 assert(begin>=0&&end>begin,'lab order DELETE endpoint');
 const route=server.slice(begin,end);
 assert(route.includes('/* PB1742 safe stuck order cancellation */'));
 const match=route.match(/if \(order\.downloaded_at && !(\[[^\]]+\])\.includes\(String\(order\.status \|\| ''\)\)\)/);
 assert(match,'guard must explicitly whitelist pre-print statuses only');
 const allowed=JSON.parse(match[1].replaceAll("'",'"'));
 assert.deepEqual(allowed,['sent','received','downloaded']);
 for(const status of ['sent','received','downloaded'])assert(allowed.includes(status));
 for(const status of ['printing','reviewing','ready_print','printed','ready','completed','cancelled','uploading'])assert(!allowed.includes(status));
 for(const guard of [
  "status IN ('printing','reviewing','ready_print','printed','ready','completed','binding')",
  'order.printed_at',
  'order_print_started',
  'paid_order_requires_lab',
  'courier_already_requested',
  'postBalancedFinanceTransaction',
  "status='cancelled'",
  'COMMIT',
  'deleteStoredKeyBestEffort'
 ]) assert(route.includes(guard),'must retain safeguard: '+guard);
 const deleted=route.indexOf("await Promise.all(storageKeys.map");
 const commit=route.indexOf("await c.query('COMMIT')");
 assert(deleted>commit,'cloud delete only after DB transaction commits');
});
test('both web and native queues offer individual deletion to stuck downloads, but not paid/printed/active orders',()=>{
 const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const match=js.match(/,ma=le=>([\s\S]{0,1200}?),si=async le=>/);
  assert(match,root+' original lab queue delete function must remain');
  const canCancel=new Function('le','return ('+match[1]+');');
  const base={id:'test',status:'received',downloaded_at:'2026-11-01T10:00:00Z',printed_at:null,payment_status:'unpaid'};
  for(const status of ['sent','received','downloaded']){
   assert.equal(canCancel({...base,status}),true,root+' '+status+' in stuck download');
   assert.equal(canCancel({...base,status,printed_at:'2026-11-01T11:00:00Z'}),false,root+' printed order');
   assert.equal(canCancel({...base,status,payment_status:'paid'}),false,root+' paid order');
   assert.equal(canCancel({...base,status,album_stage:'binding'}),false,root+' active binding');
  }
  for(const status of ['uploading','printing','reviewing','ready_print','printed','ready','completed','cancelled'])
   assert.equal(canCancel({...base,status}),false,root+' unsafe '+status);
  assert.equal(canCancel({...base,status:'sent',downloaded_at:null}),true);
  assert(js.includes('method:"DELETE"'),'original DELETE route used, no direct DB operations');
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert(html.includes('stuckCancel=r1742'),root+' cache-bust marker');
 }
 const native='dist/web/lab-desktop-ui';
 const m=JSON.parse(fs.readFileSync(native+'/manifest.json','utf8'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
  const row=m.files.find(x=>x.name===name);
  assert(row,'asset '+name+' is listed');
  assert.equal(row.sha256,sha(fs.readFileSync(native+'/'+name)),name+' checksum');
 }
 assert.equal(m.build,sha(JSON.stringify(m.files)));
});
test('existing primary Windows intake launch button still exists',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/photobridge-r1137-lab-local-intake.js','utf8');
  assert(js.includes("button.id='pb1137LocalIntakeButton'"),root+' primary intake launch');
 }
});
