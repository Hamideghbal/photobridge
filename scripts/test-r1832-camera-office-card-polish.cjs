'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
test('R1832: single selected booking border, readable information and aligned action column',()=>{
 const css=read('scripts/r1832-camera-office-card-polish.css');
 assert(css.includes('body.rentalAppReady.pb899MainBookings.pb1832CameraOffice'));
 assert(css.includes('grid-template-columns:minmax(0,1fr) minmax(148px,36%)'));
 assert(css.includes('.pbR1052DayGroup:has(>.pb904r2DayBooking.pb1830BookingSelected)'));
 assert(css.includes('.pb904r2DayBooking.pb1830BookingSelected'));
 assert(css.includes('outline:none!important'));
 assert(css.includes('justify-content:center!important'));
 assert(css.includes('.pbR1052DayActions>button'));
});
test('R1832: seven equal-width calendar cells, range boundary with single border and keyboard focus',()=>{
 const css=read('scripts/r1832-camera-office-card-polish.css');
 assert(css.includes('grid-template-columns:repeat(7,minmax(0,1fr))'));
 assert(css.includes('.pb843CalendarDay.pb1830BookingRange'));
 assert(css.includes('.pb843CalendarDay.pb1830BookingStart'));
 assert(css.includes('.pb843CalendarDay.pb1830BookingEnd'));
 assert(css.includes('box-sizing:border-box!important;border:1px solid'));
 assert(css.includes('outline-offset:1px!important'));
});
test('R1832: body scope selects only camera Store, not frame/chassis',()=>{
 const state={shop:{business_category:'equipment_rental'},bookings:[]};
 const classes=new Set(),listeners={},observers=[];
 const doc={readyState:'loading',body:{classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k)}},
  addEventListener:(k,fn)=>{listeners[k]=fn},getElementById:id=>id==='pb843CalendarGrid'?{}:null,querySelectorAll:()=>[]};
 const win={addEventListener:()=>{}};
 vm.runInNewContext(read('scripts/r1830-camera-office-range.js.txt'),{
  window:win,document:doc,data:state,MutationObserver:class{constructor(fn){observers.push(fn)} observe(){}},
  requestAnimationFrame:fn=>fn()
 });
 listeners.DOMContentLoaded();
 assert(classes.has('pb1832CameraOffice'));
 assert(observers.length>0,'manager calendar observer must be attached');
 state.shop.business_category='frame_chassis';
 observers[0]();
 assert(!classes.has('pb1832CameraOffice'),'frame/chassis must never receive camera styling');
 state.shop.business_category='equipment_sale';
 observers[0]();
 assert(classes.has('pb1832CameraOffice'),'switching back to camera refreshes scoped styling');
 assert(read('scripts/r1830-camera-office-range.js.txt').includes("document.body?.classList?.toggle('pb1832CameraOffice',isCamera())"));
});
test('R1832: patch follows R1830/R1831 before Windows snapshot and never edits lab or frame',()=>{
 const html=read('dist/api/equipment-rental-portal.html');
 assert(html.includes('pb1830OfficeBookingRangeRuntime'));
 assert(html.includes('pb1832OfficeCardPolishStyle'));
 assert(html.indexOf('pb1832OfficeCardPolishStyle')>html.indexOf('pb1830OfficeBookingRangeRuntime'));
 const build=read('scripts/liara-fast-build.mjs');
 const a=build.lastIndexOf("deployStep('./enable-r1831-photographer-office-header.mjs')");
 const b=build.lastIndexOf("deployStep('./enable-r1832-camera-office-card-polish.mjs')");
 const c=build.lastIndexOf("runR1314(process.execPath,['scripts/prepare-store-desktop-ui.mjs']");
 assert(a>=0&&b>a&&c>b);
 const rev=Number(read('DEPLOY_REVISION.txt').match(/-r(\d+)-/)?.[1]);
 assert(rev>=1832);
 const script=read('scripts/enable-r1832-camera-office-card-polish.mjs');
 assert(!/lab-desktop|dist\/api\/server\.js|dist\/api\/equipment-rental-book\.html/.test(script));
});
