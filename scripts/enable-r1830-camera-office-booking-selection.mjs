/* R1830: camera equipment store office selection only, after R1829.
   Existing frame/chassis, lab, accounting, and invoice APIs remain unchanged. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
function once(source,from,to,label){
 const hits=source.split(from).length-1;
 if(hits!==1)throw Error('[R1830] '+label+' anchor count '+hits);
 return source.replace(from,to);
}
let html=read('dist/api/equipment-rental-portal.html');
const camera="['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(data?.shop?.business_category||''))";
// Keep booking cards as DIRECT children of the day panel. R1052 wraps these cards
// to attach handover, return and invoice actions; wrapping them here loses those controls.
// R1830 adds a separate invoice action to the existing R1052 action container instead.
const invoiceOpen='e.preventDefault();openBookingInvoice(card.dataset.pb904r5BookingId)},true);';
const selectedOpen='e.preventDefault();if('+camera+'&&window.pb1830SelectOfficeBooking)window.pb1830SelectOfficeBooking(card.dataset.pb904r5BookingId);else openBookingInvoice(card.dataset.pb904r5BookingId)},true);';
const invoiceClick="document.addEventListener('click',e=>{const button=e.target.closest?.('[data-pb1830-invoice-id]');if(!button)return;e.preventDefault();e.stopPropagation();openBookingInvoice(button.dataset.pb1830InvoiceId)},true);";
html=once(html,invoiceOpen,selectedOpen+'\n  '+invoiceClick,'select booking on click; invoice on dedicated button');
const ending='</body></html>',last=html.lastIndexOf(ending);
if(last<0||html.slice(last+ending.length).trim())throw Error('[R1830] final HTML closing tag missing');
const css=read('scripts/r1830-camera-office-range.css'),js=read('scripts/r1830-camera-office-range.js.txt');
new Function(js);
const injection='<style id="pb1830OfficeBookingRangeStyle">'+css+'</style>\n<script id="pb1830OfficeBookingRangeRuntime">'+js+'</script>\n';
html=html.slice(0,last)+injection+html.slice(last);
if(!html.includes('[data-pb1830-invoice-id]')||!html.includes('pb1830SelectOfficeBooking')||!html.includes('pb1830BookingRange'))throw Error('[R1830] final office range handlers missing');
if(!html.includes(camera))throw Error('[R1830] camera-only selection guard missing');
write('dist/api/equipment-rental-portal.html',html);
execFileSync(process.execPath,['--check','apps/store-desktop/desktop-overlay.js'],{stdio:'inherit'});
console.log('[R1830] camera office selection on web/Windows, inclusive calendar range, invoice preserved; Windows halo disabled');
