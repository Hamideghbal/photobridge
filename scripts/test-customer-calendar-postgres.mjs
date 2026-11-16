// Isolated local PostgreSQL integration test. Never writes into the application database.
import test,{after} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import pg from 'pg';import crypto from 'node:crypto';
import {handleCustomerCRM} from '../dist/api/customer-crm.js';import {deliverAppointmentReminders} from '../dist/api/customer-appointments.js';
const source=new URL(process.env.DATABASE_URL||'postgres://localhost/invalid');if(!['localhost','127.0.0.1'].includes(source.hostname)&&source.searchParams.get('host')!=='/workspace/photobridge-env/run')throw new Error('Only an isolated local PostgreSQL instance may run this test');
const admin=new pg.Pool({connectionString:source.toString()}),name='crm_calendar_test_'+crypto.randomBytes(5).toString('hex');
await admin.query('CREATE DATABASE '+name);source.pathname='/'+name;const role=name+'_role';await admin.query('CREATE ROLE '+role+' NOLOGIN');const pool=new pg.Pool({connectionString:source.toString(),max:8});
after(async()=>{
 await pool.end();
 // Wait for graceful backend disconnects; FORCE can race pg's socket close and emit a late error.
 for(let attempt=0;attempt<20;attempt++){const active=await admin.query('SELECT 1 FROM pg_stat_activity WHERE datname=$1',[name]);if(!active.rowCount)break;await new Promise(resolve=>setTimeout(resolve,25));}
 await admin.query('DROP DATABASE '+name);await admin.query('DROP ROLE '+role);await admin.end();
});
await pool.query('CREATE TABLE labs(id uuid PRIMARY KEY);CREATE TABLE users(id uuid PRIMARY KEY)');
for(const file of ['196_customer_crm.sql','085_system_notification_center.sql','200_customer_appointments.sql'])await pool.query(fs.readFileSync('migrations/'+file,'utf8'));
const L='5dc2a8e2-bb96-4dc1-ae2d-3470c186acc1',P='8055e7be-0da5-4982-b39e-9f85dc45a92c',C='17db7829-b8bf-440b-a671-ac49a596b9bc',D='11db7829-b8bf-440b-a671-ac49a596b9bc';
await pool.query('INSERT INTO labs VALUES($1);',[L]);await pool.query('INSERT INTO users VALUES($1)',[P]);
await pool.query("INSERT INTO pb_crm.customers(id,owner_kind,owner_id,full_name,mobile) VALUES($1,'lab',$2,'ندا','09123456789'),($3,'photographer',$4,'علی','09121111111')",[C,L,D,P]);
async function api({portal='lab',path='/api/crm/appointments',method='POST',body={}}={}){
 let output;const url=new URL('http://test'+path);await handleCustomerCRM({req:{method,headers:{host:'test',origin:'http://test'}},res:{},url,a:portal==='lab'?{labRole:'lab_admin',labId:L,userId:P}:{labRole:'customer',userId:P},portal,pool,bodyJson:async()=>body,sendJson:(res,status,value)=>output={status,value},getReminderQuote:async()=>({available:true,unitPrice:100,balance:1000})});return output;
}
const valid={customerId:C,serviceName:'عکاسی کودک',startsAt:'2026-12-01T06:30:00.000Z',durationMinutes:60,smsEnabled:false};let first;
test('persist appointment, list in Tehran civil day, enqueue mandatory internal reminder only',async()=>{
 const result=await api({body:valid});assert.equal(result.status,201);first=result.value.appointment;
 const jobs=await pool.query('SELECT * FROM crm_appointment_reminders');assert.equal(jobs.rowCount,1);assert.equal(jobs.rows[0].channel,'internal');assert.equal(new Date(jobs.rows[0].due_at).toISOString(),'2026-11-30T06:30:00.000Z');
 const list=await api({method:'GET',path:'/api/crm/appointments?from=2026-12-01&to=2026-12-02'});assert.equal(list.value.appointments.length,1);assert.equal(list.value.appointments[0].customer_mobile,'09123456789');
 const other=await api({portal:'photographer',method:'GET',path:'/api/crm/appointments?from=2026-12-01&to=2026-12-02'});assert.equal(other.value.appointments.length,0);
});
test('concurrent overlapping reservations commit only one; adjacent slots remain available',async()=>{
 const attempts=await Promise.all([api({body:{...valid,startsAt:'2026-12-02T06:30:00.000Z'}}),api({body:{...valid,startsAt:'2026-12-02T06:45:00.000Z'}})]);
 assert.deepEqual(attempts.map(x=>x.status).sort(),[201,409]);
 const adjacent=await api({body:{...valid,startsAt:'2026-12-01T07:30:00.000Z'}});assert.equal(adjacent.status,201);
});
test('cross-owner customer injection and updates cannot alter another calendar',async()=>{
 assert.equal((await api({body:{...valid,customerId:D,startsAt:'2026-12-04T06:30:00.000Z'}})).status,404);
 const other=await api({portal:'photographer',method:'PUT',path:'/api/crm/appointments/'+first.id,body:{...valid,customerId:D}});assert.equal(other.status,404);
 assert.equal((await pool.query('SELECT service_name FROM pb_crm.appointments WHERE id=$1',[first.id])).rows[0].service_name,valid.serviceName);
});
test('edit changes reminder schedule, SMS is opt in and old jobs cancel',async()=>{
 const edited=await api({method:'PUT',path:'/api/crm/appointments/'+first.id,body:{...valid,startsAt:'2026-12-03T06:30:00.000Z',smsEnabled:true}});assert.equal(edited.status,200);
 const jobs=(await pool.query('SELECT * FROM crm_appointment_reminders WHERE appointment_id=$1',[first.id])).rows;
 assert.equal(jobs.filter(j=>j.state==='cancelled').length,1);assert.equal(jobs.filter(j=>j.state==='pending').length,2);
});
test('delivery workers are concurrent-safe; internal always delivers and opted-in SMS sends once',async()=>{
 const pushed=[],sms=[];const dependencies={pool,now:new Date('2026-12-02T07:00:00Z'),push:async(...args)=>pushed.push(args),sendOwnerSms:async(...args)=>sms.push(args)};
 await Promise.all([deliverAppointmentReminders(dependencies),deliverAppointmentReminders(dependencies)]);await deliverAppointmentReminders(dependencies);
 assert.equal(sms.length,1);assert.equal(pushed.filter(a=>a[4].appointmentId===first.id).length,1);
 const notification=(await pool.query("SELECT * FROM system_notifications WHERE metadata->>'appointmentId'=$1",[first.id])).rows[0];assert.equal(notification.recipient_lab_id,L);assert.match(notification.message,/ندا/);
});
test('failed paid SMS is recorded without auto retry or double charging',async()=>{
 const result=await api({body:{...valid,startsAt:'2026-12-06T06:30:00.000Z',smsEnabled:true}});assert.equal(result.status,201);
 let calls=0;const options={pool,now:new Date('2026-12-05T07:00:00Z'),push:async()=>{},sendOwnerSms:async()=>{calls++;throw new Error('service_wallet_insufficient')}};
 await deliverAppointmentReminders(options);await deliverAppointmentReminders(options);assert.equal(calls,1);
 const job=await pool.query("SELECT state,error_code FROM crm_appointment_reminders WHERE appointment_id=$1 AND channel='sms'",[result.value.appointment.id]);assert.equal(job.rows[0].state,'failed');assert.equal(job.rows[0].error_code,'service_wallet_insufficient');
});
test('cancelled appointments produce neither notification nor paid SMS',async()=>{
 const result=await api({body:{...valid,startsAt:'2026-12-08T06:30:00.000Z',smsEnabled:true}});
 await api({method:'PUT',path:'/api/crm/appointments/'+result.value.appointment.id,body:{...valid,startsAt:'2026-12-08T06:30:00.000Z',smsEnabled:true,status:'cancelled'}});
 await deliverAppointmentReminders({pool,now:new Date('2026-12-07T07:00:00Z'),push:()=>assert.fail('cancelled push'),sendOwnerSms:()=>assert.fail('cancelled SMS')});
});

test('RLS enforces owner boundaries with a non-superuser role',async()=>{
 await pool.query('GRANT USAGE ON SCHEMA pb_crm TO '+role);await pool.query('GRANT SELECT ON ALL TABLES IN SCHEMA pb_crm TO '+role);
 const c=await pool.connect();try{
 await c.query('BEGIN');await c.query('SET LOCAL ROLE '+role);
 assert.equal((await c.query('SELECT id FROM pb_crm.appointments')).rowCount,0);
 await c.query("SELECT set_config('pb_crm.owner_kind','photographer',true),set_config('pb_crm.owner_id',$1,true)",[P]);
 assert.equal((await c.query('SELECT id FROM pb_crm.appointments')).rowCount,0);
 await c.query("SELECT set_config('pb_crm.owner_kind','lab',true),set_config('pb_crm.owner_id',$1,true)",[L]);assert((await c.query('SELECT id FROM pb_crm.appointments')).rowCount>0);
 await c.query('ROLLBACK');
 }finally{c.release()}
});
test('stale edits cannot overwrite a newer appointment revision',async()=>{
 const result=await api({body:{...valid,startsAt:'2026-12-10T06:30:00.000Z'}});const row=result.value.appointment;
 const a=await api({method:'PUT',path:'/api/crm/appointments/'+row.id,body:{...valid,startsAt:'2026-12-10T06:30:00.000Z',expectedRevision:row.revision,notes:'ویرایش اول'}});assert.equal(a.status,200);
 const b=await api({method:'PUT',path:'/api/crm/appointments/'+row.id,body:{...valid,startsAt:'2026-12-10T06:30:00.000Z',expectedRevision:row.revision,notes:'ویرایش قدیمی'}});assert.equal(b.status,409);assert.equal(b.value.error,'appointment_changed');
});

test('note-only edits never enqueue another paid reminder',async()=>{
 const result=await api({body:{...valid,startsAt:'2026-12-12T06:30:00.000Z',smsEnabled:true}});const row=result.value.appointment;
 const updated=await api({method:'PUT',path:'/api/crm/appointments/'+row.id,body:{...valid,startsAt:'2026-12-12T06:30:00.000Z',smsEnabled:true,notes:'یادداشت جدید',expectedRevision:row.revision}});assert.equal(updated.status,200);
 assert.equal(updated.value.appointment.reminder_revision,row.reminder_revision);assert.equal(updated.value.appointment.revision,row.revision+1);
 const jobs=await pool.query('SELECT * FROM crm_appointment_reminders WHERE appointment_id=$1',[row.id]);assert.equal(jobs.rowCount,2);
});
test('photographer reminders reach that photographer without lab scope or SMS opt-in',async()=>{
 const result=await api({portal:'photographer',body:{...valid,customerId:D,startsAt:'2026-12-16T06:30:00.000Z'}});assert.equal(result.status,201);
 const pushed=[];await deliverAppointmentReminders({pool,now:new Date('2026-12-15T07:00:00Z'),push:async(...args)=>pushed.push(args),sendOwnerSms:()=>assert.fail('SMS not enabled')});
 const row=pushed.find(args=>args[4].appointmentId===result.value.appointment.id);assert.equal(row[0],'customer');assert.equal(row[1],P);
});
