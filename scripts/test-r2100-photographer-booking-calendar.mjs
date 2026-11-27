import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {patchBook,replaceBookingSubmit,patchChooserStartup,patchVisibleCalendar} from './enable-r2100-photographer-booking-calendar.mjs';
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
 assert.ok(html.includes('id="pb2100PhotographerCalendarStyle"'),'actual built HTML must contain calendar, not just test-patched copy');
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

test('R2103 invalid day stays clickable, warns without changing selection, and confirmation is single-step',()=>{
 assert.match(s,/id="pb2103CalendarWarning"/);
 assert.match(s,/b\.disabled=iso<today/);
 assert.match(s,/نمی‌توانید در یک آفیش چند روز با فاصله از هم انتخاب کنید/);
 assert.match(s,/warning\.hidden=false;return/);
 assert.match(s,/done\.disabled=!chosen\.length/);
 assert.match(s,/rentalDateConfirmedKeyV811=days\.length\?rentalDateKeyV811/);
 assert.match(s,/b\.dispatchEvent\(new Event\('input'\)\)/);
});

test('R2103 only requested camera panel loads and duplicate visible requests coalesce',async()=>{
 const a=s.indexOf('function pb2103LoadVisibleStore('),b=s.indexOf('\nconst pb2103PanelLoads=new Map();',a);
 const src=s.slice(a,b);
 const calls=[],fn=new Function('loadBookings','loadFinance','loadSales','pbProductionStore','selectedShopRecord','let shopId="s",shopLoadToken=1;const pb2103PanelLoads=new Map();'+src+';return pb2103LoadVisibleStore')(()=>calls.push('bookings'),()=>calls.push('finance'),()=>calls.push('sales'),()=>false,()=>({}));
 fn('equipmentPanel');fn('bookingsPanel');fn('bookingsPanel');
 await Promise.resolve();assert.deepEqual(calls,['bookings']);
 fn('salesPanel');await Promise.resolve();assert.deepEqual(calls,['bookings','sales']);
 assert.match(s,/if\(pbProductionStore\(target\)\)void Promise\.allSettled/);
 assert.match(s,/void loadPhotographerIdentity\(\)\.catch\(\(\)=>null\);\s*const d=await api\('\/api\/customer\/equipment-rental\/shops'\);/);
});

test('R2103 actual calendar click warns for a gap, then selects and removes adjacent days',()=>{
 const nodes=new Map();
 function node(){return {children:[],hidden:true,append(n){this.children.push(n)},replaceChildren(){this.children=[]},setAttribute(){},showModal(){this.open=true},close(){this.open=false}}}
 const $=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 let selected;
 const calendar=extract('pb2100OpenCalendar','function pb2100ShowReceipt');
 const open=new Function('$','document','pb2100Today','pb2100Days','jalaliPartsFromIso','jalaliMonths','fa','toGregorian','jalaliMonthLength','dateFa','pb2100SetDays',extract('pb2100Adjacent','function pb2100Toggle')+'\n'+extract('pb2100Toggle','function pb2100Today')+'\n'+calendar+';return pb2100OpenCalendar')($,{createElement:node},()=> '2026-11-01',()=>[],()=>({year:2026,month:11}),Array(12).fill('ماه'),String,(y,m,d)=>({gy:y,gm:m,gd:d}),()=>30,String,d=>selected=d);
 open();
 const get=d=>$('#pb2100CalendarGrid').children.find(x=>x.textContent===String(d));
 get(1).onclick();assert.equal(get(3).disabled,false);get(3).onclick();
 assert.equal($('#pb2103CalendarWarning').hidden,false);
 get(2).onclick();assert.equal($('#pb2103CalendarWarning').hidden,true);
 get(2).onclick();$('#pb2100CalendarDone').onclick();
 assert.deepEqual(selected,['2026-11-01']);
});

test('R2104 chooser startup accepts the actual R1837 build output without reintroducing the blocking identity wait',()=>{
 const old="const [_,d]=await Promise.all([loadPhotographerIdentity(),api('/api/customer/equipment-rental/shops')]);";
 const real="void loadPhotographerIdentity().catch(()=>null);\n    const d=await api('/api/customer/equipment-rental/shops');";
 const before="async function boot(){\n",after="\nrenderShops();renderStoreChooserR96();}";
 assert.equal(patchChooserStartup(before+old+after),before+real+after);
 assert.equal(patchChooserStartup(before+real+after),before+real+after);
 assert.throws(()=>patchChooserStartup('unrecognized startup'),/unrecognized chooser startup contract/);
});

test('R2105 actual visible R63 calendar uses adjacent day clicks on both platforms',()=>{
 const live=fs.readFileSync('dist/web/photobridge-r63-photographer-store.js','utf8');
 assert.match(live,/PB2105 live day selection/);
 assert.match(html,/liveCalendar=r2105/);
 assert.equal(patchVisibleCalendar(live),live);
 const a=live.indexOf('  function pb2105Adjacent'),b=live.indexOf('  function pb2105PaintWarning',a);
 assert.ok(a>=0&&b>a);
 const range=new Function(live.slice(a,b)+';return pb2105Range')();
 const one=range('','','2026-11-28');
 assert.deepEqual(one,{start:'2026-11-28',end:'',warning:''});
 const gap=range(one.start,one.end,'2026-11-30');
 assert.match(gap.warning,/فاصله/);assert.equal(gap.end,'');
 const two=range(one.start,one.end,'2026-11-29');
 const three=range(two.start,two.end,'2026-11-30');
 assert.deepEqual(three,{start:'2026-11-28',end:'2026-11-30',warning:''});
 assert.match(range(three.start,three.end,'2026-11-29').warning,/فاصله/);
 assert.deepEqual(range(three.start,three.end,'2026-11-30'),two);
 assert.deepEqual(range(one.start,one.end,'2026-11-28'),{start:'',end:'',warning:''});
 assert.match(live,/pb2105Warning=next.warning;rs=next.start;re=next.end;render\(\);pb2105PaintWarning\(\)/);
 assert.match(live,/if\(!pb2105Camera\(\)\)/);
});
