import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {patchBook,replaceBookingSubmit} from './enable-r2100-photographer-booking-calendar.mjs';
const html=fs.readFileSync('dist/api/equipment-rental-book.html','utf8'),s=patchBook(html);
function extract(name,next){const a=s.indexOf('function '+name+'('),b=s.indexOf('\n'+next,a);assert.ok(a>=0&&b>a,name);return s.slice(a,b)}
const days=new Function(extract('pb2100Adjacent','function pb2100Toggle')+'\n'+extract('pb2100Toggle','function pb2100Today')+';return pb2100Toggle')();
test('R2100 contiguous day selection adds adjacent days and removes endpoints',()=>{
 const today='2026-11-27';
 assert.deepEqual(days([],today,today),[today]);
 assert.deepEqual(days([today],'2026-11-29',today),[today]);
 const two=days([today],'2026-11-28',today);assert.deepEqual(two,[today,'2026-11-28']);
 const three=days(two,'2026-11-29',today);assert.equal(three.length,3);
 assert.deepEqual(days(three,'2026-11-28',today),three);
 assert.deepEqual(days(three,'2026-11-29',today),two);
 assert.deepEqual(days([today],today,today),[]);
 assert.deepEqual(days([],'2026-11-26',today),[]);
 assert.deepEqual(days(['2026-11-30'],'2026-12-01',today),['2026-11-30','2026-12-01']);
});
test('R2100 committed response exits form to the specific receipt independent of history refresh',async()=>{
 const start=s.indexOf('async function pb2100SubmitRentalBooking('),end=s.indexOf('\nlet pb2100Submitting',start),source=s.slice(start,end);
 assert.ok(start>=0&&end>start);
 for(const success of [true,false]){
  const calls=[],nodes=new Map(),$=id=>{if(!nodes.has(id))nodes.set(id,{value:'draft',checked:true});return nodes.get(id)};
  const run=new Function('$','api','validRequestBody','msg','closeRentalRequestV809','closeRentalDateConfirmV811','openStoreSection','pb2100ShowReceipt','pb2100SetDays','renderItems', 'let shopId="shop",shops=[{id:"shop",name:"test"}],pb2100Submitting=false;\n'+source+'\nreturn pb2100SubmitRentalBooking()');
  await run($,async()=>{if(!success)throw {error:'equipment_unavailable'};return{ok:true,id:'created'}},()=>({shopId:'shop',startDate:'2026-11-27',endDate:'2026-11-27'}),()=>{},()=>calls.push('close'),()=>{},x=>calls.push(x),x=>calls.push(x.id),()=>calls.push('reset'),()=>{});
  assert.deepEqual(calls,success?['close','bookingsPanel','created','reset']:[]);
  assert.equal($('#notes').value,success?'':'draft');
 }
});
test('R2100 final UI has one date selector, hidden API dates and a scoped booking receipt',()=>{
 assert.equal(patchBook(s),s);assert.match(s,/id="pb2100Calendar"/);
 assert.match(s,/id="start" type="hidden"/);assert.match(s,/id="end" type="hidden"/);
 assert.match(s,/data-pb2100-booking-id="\$\{esc\(b.id\)\}"/);
 assert.match(s,/out\.bookingCode/);assert.match(s,/void loadBookings\(\)\.then\(mark\)/);
 assert.match(s,/openStoreSection\('bookingsPanel'\)/);
 assert.match(s,/String\(shopId\)!==String\(body.shopId\)/);
});

test('R2102 booking replacement survives multiline legacy navigation without consuming next handler',()=>{
 const before="const before=1;\n",after="\nconst after=2;\n";
 const source="async function submitRentalBooking(retryProfile=true){\nconst body=validRequestBody();\ntry{await api('/api/customer/equipment-rental/bookings',{method:'POST',body:JSON.stringify(body)});\ncloseRentalRequestV809();openStoreSection('bookingsPanel');}catch(e){msg(e.message)}\n}";
 const replacement="async function submitRentalBooking(retryProfile=true){return pb2100SubmitRentalBooking(retryProfile)}";
 assert.equal(replaceBookingSubmit(before+source+after,replacement),before+replacement+after);
 assert.throws(()=>replaceBookingSubmit(before+source+source+after,replacement),/declaration count/);
 assert.throws(()=>replaceBookingSubmit(source.replace('closeRentalRequestV809','unknownClose'),replacement),/boundary or contract/);
});
