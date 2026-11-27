import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flushLabDownloadOverdue,candidateSQL,freshSQL} from '../dist/api/lab-download-overdue.js';
function fixture(){
 let now=0;const rows=[{id:'a',number:279,lab_id:'labA',lab_name:'آزمایشگاه اول',mode:'print',eligibleAt:0,downloaded:false},{id:'b',number:280,lab_id:'labA',lab_name:'آزمایشگاه اول',mode:'album',eligibleAt:0,downloaded:false}];
 const claims=new Map(),sms=[],logs=[];let manager=true,fail=false;
 const pool={async query(q,args){
  if(q.includes('r2068 candidates'))return {rows:rows.flatMap(r=>{const m=claims.get('lab-download-overdue:v1:'+r.id+':manager'),a=claims.get('lab-download-overdue:v1:'+r.id+':admin');return !r.downloaded&&now-r.eligibleAt>=15&&!a&&(!m||now-m.at>=30)?[{...r,stage:m?'admin':'manager'}]:[];})};
  if(q.includes('r2068 still eligible'))return {rowCount:rows.some(r=>r.id===args[0]&&r.lab_id===args[1]&&!r.downloaded)?1:0};
  if(q.includes('r2068 manager'))return {rows:manager?[{id:'manager',mobile:'09120000000'}]:[]};
  if(q.includes('r2068 admin'))return {rows:[{id:'admin',mobile:'09130000000'}]};
  if(q.includes('r2068 claim')){if(claims.has(args[0]))return {rowCount:0};claims.set(args[0],{at:now,...JSON.parse(args[1])});return {rowCount:1};}
  if(q.includes('r2068 finish')){claims.set(args[0],{at:now,...JSON.parse(args[1])});return {rowCount:1};}
  throw Error(q);
 }};
 const deps={pool,normalizeMobile:s=>s,sendSms:async args=>{sms.push(args);if(fail)throw Error('provider timeout');return {reference:'accepted'};},log:s=>logs.push(s)};
 return {rows,claims,sms,logs,tick:()=>flushLabDownloadOverdue(deps),time:v=>{now=v;},missingManager:()=>{manager=false;},fail:()=>{fail=true;}};
}
test('15 minutes then 30 more; grouped messages and durable duplicate suppression',async()=>{
 const f=fixture();f.time(14);await f.tick();assert.equal(f.sms.length,0);
 f.time(15);await f.tick();await f.tick();assert.equal(f.sms.length,1);assert.equal(f.sms[0].userId,'manager');assert.deepEqual(f.sms[0].metadata.orderIds,['a','b']);
 f.time(44);await f.tick();assert.equal(f.sms.length,1);
 f.rows[0].downloaded=true;f.time(45);await f.tick();await f.tick();assert.equal(f.sms.length,2);assert.equal(f.sms[1].userId,'admin');assert.deepEqual(f.sms[1].metadata.orderIds,['b']);
});
test('resolved orders never escalate',async()=>{
 const f=fixture();f.time(15);await f.tick();f.rows.forEach(r=>r.downloaded=true);f.time(60);await f.tick();assert.equal(f.sms.length,1);
});
test('missing manager number escalates; uncertain provider outcome does not repeat',async()=>{
 const f=fixture();f.missingManager();f.time(15);await f.tick();assert.equal(f.sms.length,0);
 f.time(45);f.fail();await f.tick();await f.tick();assert.equal(f.sms.length,1);assert.equal(f.sms[0].userId,'admin');
});
test('selection excludes unsubmitted, unpaid, incomplete, and already downloaded orders',()=>{
 for(const s of [candidateSQL,freshSQL]){
  assert.match(s,/status IN \('sent','received'\)/);assert.match(s,/downloaded_at IS NULL/);assert.match(s,/payment_status='paid'/);assert.match(s,/original_state='pending'/);assert.match(s,/original_state='active'/);
 }
 assert.match(candidateSQL,/interval '15 minutes'/);assert.match(candidateSQL,/interval '30 minutes'/);
});
