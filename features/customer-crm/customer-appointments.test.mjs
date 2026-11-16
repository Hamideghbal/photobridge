import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAppointment,reminderCopy,deliverAppointmentReminders} from '../../dist/api/customer-appointments.js';
const customerId='17db7829-b8bf-440b-a671-ac49a596b9bc';
const valid={customerId,serviceName:'عکاسی کودک',startsAt:'2026-12-01T06:30:00.000Z',durationMinutes:60,smsEnabled:false};
test('appointment accepts Tehran-compatible ISO times and rejects malformed dates and amounts',()=>{
 assert.equal(validateAppointment(valid).startsAt,valid.startsAt);
 assert.equal(validateAppointment({...valid,startsAt:'2026-12-01T06:30:00Z'}).startsAt,'2026-12-01T06:30:00Z');
 for(const change of [{startsAt:'2026-02-30T06:30:00Z'},{durationMinutes:0},{durationMinutes:721},{customerId:'other'},{serviceName:''},{smsEnabled:'true'}])assert.throws(()=>validateAppointment({...valid,...change}));
});
test('reminder uses Persian date, Tehran time, real customer and service',()=>{
 const copy=reminderCopy({starts_at:valid.startsAt,customer_name:'ندا',service_name:'پرتره'});
 assert.match(copy.message,/ندا/);assert.match(copy.message,/پرتره/);assert.match(copy.message,/۱۰:۰۰/);
});
test('no due job produces no notification, SMS or charge',async()=>{
 const calls=[];await deliverAppointmentReminders({pool:{connect:async()=>({query:async sql=>{calls.push(sql);return {rows:[]}},release(){}})},push:()=>assert.fail('unexpected push'),sendOwnerSms:()=>assert.fail('unexpected paid SMS')});
 assert.deepEqual(calls,['BEGIN',"SELECT * FROM crm_appointment_reminders WHERE state='pending' AND due_at<=$1 ORDER BY due_at LIMIT 1 FOR UPDATE SKIP LOCKED",'COMMIT']);
});
