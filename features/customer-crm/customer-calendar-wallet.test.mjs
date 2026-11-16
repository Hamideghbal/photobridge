import {countSmsSegments} from './sms-segment-counter.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const smsContext={compactSms:args=>String(args.message||''),smsParts:text=>{const m=countSmsSegments(text);return {...m,parts:m.segments||1}}};
const source=fs.readFileSync('dist/api/server.js','utf8');
const extract=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const bridge=extract('async function sendCrmReminderSms(', 'let crmReminderSweepBusy');
for(const kind of ['lab','photographer'])test(kind+' reminder charges only the account owner through the existing SMS wallet',async()=>{
 let sent;const context={crmReminderQuote:async()=>({available:true,unitPrice:150,recipientMobile:'09121111111'}),crmReminderRecipient:async()=>({id:'user'}),sendSms:async args=>{sent=args},reminderCopy:()=>({message:'فردا ساعت ۱۰'})};
 const send=vm.runInNewContext(bridge+';sendCrmReminderSms',context);await send({owner_kind:kind,owner_id:'owner',id:'job'},{id:'appointment'});
 assert.equal(sent.mobile,'09121111111');assert.equal(sent.serviceKey,'sms_customer_notification');assert.equal(sent.quotedAmount,150);assert.equal(sent.referenceId,'job');assert.equal(sent[kind==='lab'?'chargeLabId':'chargePhotographerId'],'owner');assert.equal(sent[kind==='lab'?'chargePhotographerId':'chargeLabId'],undefined);
});
const sendSource=extract('async function sendSms(args)', 'function normalizePublicEmail');
for(const kind of ['lab','photographer'])test(kind+' provider failure refunds the exact reserved SMS charge',async()=>{
 let refunds=0,reserves=0;const charge={amount:150,transaction:{id:'tx'}};
 const reserve=async()=>{reserves++;return charge};const refund=async got=>{refunds++;assert.equal(got,charge)};
 const context={...smsContext,resolvedSMSSettings:async()=>({configured:true,provider:'test'}),normalizeMobile:String,SMS_PROVIDER_ADAPTERS:{test:async()=>{throw Error('provider_failed')}},reservePhotographerWalletCharge:reserve,reserveServiceWalletCharge:reserve,refundPhotographerWalletCharge:refund,refundServiceWalletCharge:refund,logSms:async()=>{}};
 const send=vm.runInNewContext(sendSource+';sendSms',context);
 await assert.rejects(()=>send({mobile:'09121111111',message:'یادآوری',serviceKey:'sms_customer_notification',[kind==='lab'?'chargeLabId':'chargePhotographerId']:'owner'}),/provider_failed/);assert.equal(reserves,1);assert.equal(refunds,1);
});
test('insufficient balance never contacts paid SMS provider',async()=>{
 let calls=0;const context={...smsContext,resolvedSMSSettings:async()=>({configured:true,provider:'test'}),normalizeMobile:String,SMS_PROVIDER_ADAPTERS:{test:async()=>{calls++}},reserveServiceWalletCharge:async()=>{throw Error('service_wallet_insufficient')},logSms:async()=>{}};
 const send=vm.runInNewContext(sendSource+';sendSms',context);
 await assert.rejects(()=>send({mobile:'09121111111',serviceKey:'sms_customer_notification',chargeLabId:'owner'}),/service_wallet_insufficient/);assert.equal(calls,0);
});
test('push links open the correct owner calendar and appointment day',()=>{
 const code=extract('function webPushTargetUrl(', 'async function sendWebPushToRecipient(');
 const target=vm.runInNewContext(code+';webPushTargetUrl');
 for(const kind of ['lab','customer'])assert.equal(target(kind,'crm_appointment_reminder',{date:'2026-12-01'}),'/customer-crm.html?portal='+(kind==='lab'?'lab':'photographer')+'&view=calendar&date=2026-12-01');
});
