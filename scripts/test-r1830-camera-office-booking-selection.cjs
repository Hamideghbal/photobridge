'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function element(id,day){
 const classes=new Set(),attrs={};
 return {id,dataset:day?{pb843CalDay:day}:{pb904r5BookingId:id},
  classList:{contains:x=>classes.has(x),toggle:(x,on)=>{if(on)classes.add(x);else classes.delete(x)}},
  getAttribute:name=>attrs[name]??null,setAttribute:(name,value)=>{attrs[name]=String(value)},
  removeAttribute:()=>{}};
}
test('R1830: four-day booking highlights exactly four inclusive dates and selects its card',()=>{
 const dates=['2026-11-12','2026-11-13','2026-11-14','2026-11-15','2026-11-16','2026-11-17'].map(d=>element('',d));
 const cards=[element('a'),element('b')];
 const data={shop:{business_category:'equipment_rental'},bookings:[
  {id:'a',rental_start:'2026-11-13',rental_end:'2026-11-16',status:'reserved'},
  {id:'b',rental_start:'2026-11-17',rental_end:'2026-11-17',status:'reserved'}]};
 const win={},doc={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,
  querySelectorAll:sel=>sel.includes('data-pb843-cal-day')?dates:sel.includes('data-pb904r5-booking-id')?cards:[],
  querySelector:()=>null};
 vm.runInNewContext(read('scripts/r1830-camera-office-range.js.txt'),{
  window:win,document:doc,data,requestAnimationFrame:cb=>cb(),MutationObserver:class{},pb843RenderCalendar:()=>{},pb904r2RenderDayPanel:()=>{}});
 assert.equal(win.pb1830SelectOfficeBooking('a'),true);
 assert.deepEqual(dates.filter(d=>d.classList.contains('pb1830BookingRange')).map(d=>d.dataset.pb843CalDay),
  ['2026-11-13','2026-11-14','2026-11-15','2026-11-16']);
 assert(cards[0].classList.contains('pb1830BookingSelected'));
 assert.equal(cards[0].getAttribute('aria-pressed'),'true');
 assert.equal(win.pb1830SelectOfficeBooking('b'),true);
 assert.deepEqual(dates.filter(d=>d.classList.contains('pb1830BookingRange')).map(d=>d.dataset.pb843CalDay),['2026-11-17']);
 assert.equal(cards[0].getAttribute('aria-pressed'),'false');
 data.bookings[1].status='cancelled';
 assert.equal(win.pb1830SelectOfficeBooking('b'),false,'cancelled bookings are not selected');
});
test('R1830: frame/chassis shops never activate the new booking selection',()=>{
 const win={},data={shop:{business_category:'frame'},bookings:[{id:'a',rental_start:'2026-11-13',rental_end:'2026-11-16'}]};
 vm.runInNewContext(read('scripts/r1830-camera-office-range.js.txt'),{window:win,data,
  document:{readyState:'loading',addEventListener:()=>{}},requestAnimationFrame:cb=>cb(),
  MutationObserver:class{},pb843RenderCalendar:()=>{},pb904r2RenderDayPanel:()=>{}});
 assert.equal(win.pb1830SelectOfficeBooking('a'),false);
});
test('R1830: mobile website booking dialog provides selection plus an independent invoice button',()=>{
 const booking={id:'mobile-one',rental_start:'2026-11-13',rental_end:'2026-11-16',status:'reserved'};
 const data={shop:{business_category:'equipment_rental'},bookings:[booking]};
 const listeners=[],card={dataset:{},attributes:{},children:[],querySelector:()=>null,append(x){this.children.push(x)},setAttribute(k,v){this.attributes[k]=v}};
 let closed=0;
 const doc={readyState:'loading',
  addEventListener:(type,fn)=>listeners.push({type,fn}),
  getElementById:()=>null,
  querySelectorAll:sel=>sel.includes('pb843BookingDetailCard')?[card]:[],
  querySelector:()=>null,
  createElement:tag=>({tag,dataset:{},children:[],append(...nodes){this.children.push(...nodes)}})};
 const window={};
 vm.runInNewContext(read('scripts/r1830-camera-office-range.js.txt'),{
  window,document:doc,data,requestAnimationFrame:cb=>cb(),MutationObserver:class{},
  matchMedia:()=>({matches:true}),pb843RenderCalendar:()=>{},pb904r2RenderDayPanel:()=>{},
  pb843BookingsForIso:()=>[booking],pb843OpenBookingDay:()=>{},pb843CloseBookingDay:()=>{closed++}
 });
 window.pb843OpenBookingDay('2026-11-13');
 assert.equal(card.children.length,1);
 assert.equal(card.dataset.pb1830ModalSelectId,'mobile-one','the whole card is selectable');
 const buttons=card.children[0].children;
 assert.equal(buttons[0].dataset.pb1830ModalSelectId,'mobile-one');
 assert.equal(buttons[1].dataset.pb1830InvoiceId,'mobile-one');
 const click=listeners.filter(x=>x.type==='click').map(x=>x.fn);
 const event={target:{closest:sel=>sel.includes('data-pb1830-modal-select-id')?buttons[0]:null},preventDefault:()=>{}};
 for(const fn of click)fn(event);
 assert.equal(closed,1,'selecting on mobile closes modal to reveal the highlighted calendar');
});
test('R1830: daily office card selects range, invoice remains accessible via its own action',()=>{
 const html=read('dist/api/equipment-rental-portal.html');
 assert(html.includes('pb1830OfficeBookingRangeRuntime'));
 assert(html.includes('pb1830OfficeBookingRangeStyle'));
 assert(html.includes('[data-pb1830-invoice-id]'),'invoice action is wired by delegation');
 assert(html.includes('rows.map(b=>`<button type="button" class="pb904r2DayBooking"'),'existing R1052 cards stay direct children');
 const rangeJS=read('scripts/r1830-camera-office-range.js.txt');
 assert(rangeJS.includes("card.closest?.('.pbR1052DayGroup')"),'new invoice uses existing booking action group');
 assert(rangeJS.includes('[data-office-action="invoice"]'),'does not duplicate existing invoice action');
 assert(html.includes('window.pb1830SelectOfficeBooking(card.dataset.pb904r5BookingId)'));
 assert(html.includes('openBookingInvoice(button.dataset.pb1830InvoiceId)'));
 assert(html.includes("['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))"));
 assert(html.includes('pb1830BookingRange'));
});
test('R1830: blue wash hidden only on Windows camera store; lab and frame shop remain untouched',()=>{
 const overlay=read('apps/store-desktop/desktop-overlay.js');
 assert(overlay.includes('body.rentalAppReady.pb1830CameraDesktop::before{display:none!important;content:none!important;background:none!important}'));
 assert(overlay.includes("document.body.classList.toggle('pb1830CameraDesktop',!frame)"));
 assert(overlay.includes("classList.remove('pb1830CameraDesktop'"));
 const deploy=read('scripts/enable-r1830-camera-office-booking-selection.mjs');
 assert(!/dist\/api\/server.js|lab-desktop-ui|lab-[a-z]+\.js/.test(deploy));
 assert(!/frame_chassis/.test(deploy));
});
test('R1830: final build regenerates Windows hot update after both patches',()=>{
 const build=read('scripts/liara-fast-build.mjs');
 const a=build.lastIndexOf("deployStep('./enable-r1829-camera-scroll-refresh.mjs')");
 const b=build.lastIndexOf("deployStep('./enable-r1830-camera-office-booking-selection.mjs')");
 const c=build.lastIndexOf("deployStep('./prepare-store-desktop-ui.mjs')");
 assert(a>=0&&b>a&&c>b,'store snapshot must include R1829 + R1830');
 assert(read('DEPLOY_REVISION.txt').includes('-r1830-'));
});