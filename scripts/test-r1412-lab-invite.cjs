const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('dist/web/photobridge-v904r98-invite-stable.js','utf8');
test('lab issuer wins over birthday requirements and generic store name',()=>{
 const src=ui.match(/function PB1412IsRental\(invite,fields\)\{[^\n]*\}/)[0];
 const fn=vm.runInNewContext('('+src+')',{normalizeReq:x=>x});
 assert.equal(fn({issuerType:'lab',issuerName:'فروشگاه'},{birthDate:true}),false);
 assert.equal(fn({issuer_type:'lab'},{nationalId:true}),false);
 assert.equal(fn({issuerLabName:'دید سوم'},{birthDate:true}),false);
 assert.equal(fn({issuerType:'rental'},{birthDate:true}),true);
});
test('lab copy uses lab name and print services',()=>{
 const src=ui.match(/function PB1412LabName\(invite\)\{[^\n]*\}/)[0];
 const name=vm.runInNewContext('('+src+')');
 assert.equal(name({issuerLabName:'دید سوم',issuerName:'فروشگاه'}),'دید سوم');
 assert.equal(name({issuerName:'فروشگاه'}),'');
 assert.match(ui,/سفارش چاپ، آلبوم و پیگیری همکاری/);
 assert.match(ui,/تأیید اطلاعات و اتصال به لابراتوار/);
 assert.match(ui,/اطلاعات درخواستی لابراتوار/);
});
test('both existing lab and rental invitees activate shared desktop columns',()=>{
 assert.ok(ui.includes("classList.toggle('pbR1411ExistingRentalInvite',isExisting()&&Boolean(state.ctx?.invite))"));
});
