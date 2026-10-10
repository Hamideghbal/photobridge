const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('dist/api/server.js','utf8');
const receiver=fs.readFileSync('dist/web/photobridge-r1087-commitment-autoprint.js','utf8');
test('print handover feed does not fall into desktop sync dispatcher',()=>{
 const route=server.indexOf("url.pathname==='/api/rental/print-handovers'");
 const intercept=server.indexOf("url.pathname.startsWith('/api/rental/desktop/')");
 assert(route>intercept,'route must be outside desktop sync matcher');
 assert(server.includes('/* PB_R1094_WINDOWS_PRINT_HANDOVERS */'));
 assert(server.slice(route,route+1050).includes('equipmentRentalCurrentShop(a)'));
 assert(server.slice(route,route+1050).includes('shop_id=$1'));
 assert(server.slice(route,route+1050).includes("status='picked_up'"));
 assert(server.slice(route,route+1050).includes('handover_serials_recorded_at IS NOT NULL'));
});
test('Windows 1.0.3 native print HTML validation now accepts server document',()=>{
 assert(server.includes('<title>تعهدنامه واگذاری تجهیزات تصویربرداری به صورت امانی</title>'));
 assert(server.includes('const doc='));
 assert(!server.includes('<title>برگه واگذاری تجهیزات تصویربرداری به صورت امانی</title>'));
});
test('native bridge takes precedence over attempted localhost HTML fetch',()=>{
 assert(receiver.includes("'/api/rental/print-handovers'"));
 assert(receiver.includes("fetch('/desktop/sync'"));
 assert(receiver.includes("window.__PB_DESKTOP_PRINT__({kind:'rental-commitment',bookingId:String(b.id)})"));
 const start=receiver.indexOf('function printDocument');
 const bridge=receiver.indexOf("typeof window.__PB_DESKTOP_PRINT__==='function'",start);
 const html=receiver.indexOf("const res=await fetch('/api/rental/bookings/'",start);
 assert(bridge>start&&html>bridge,'native branch must run before HTML proxy');
});
