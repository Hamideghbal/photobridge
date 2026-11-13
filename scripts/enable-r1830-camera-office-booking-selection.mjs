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
const dollar=String.fromCharCode(36,123),tick=String.fromCharCode(96);
const dayButton='<button type="button" class="pb904r2DayBooking" data-pb904r5-booking-id="'+dollar+'esc(b.id)}">';
const wrap=dollar+camera+"?'<div class=\"pb1830BookingRow\">':''}";
html=once(html,dayButton,wrap+dayButton,'camera-only booking wrapper');
const end='</button>'+tick+").join(''):'<div class=\"empty\">برای این روز آفیشی ثبت نشده است.</div>';";
const newEnd='</button>'+dollar+camera+"?'<button type=\"button\" class=\"pb1830InvoiceAction\" data-pb1830-invoice-id=\"'+esc(b.id)+'\">فاکتور</button></div>':''}"+tick+").join(''):'<div class=\"empty\">برای این روز آفیشی ثبت نشده است.</div>';";
html=once(html,end,newEnd,'camera-only booking invoice action');
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
if(!html.includes('data-pb1830-invoice-id=')||!html.includes('pb1830SelectOfficeBooking')||!html.includes('pb1830BookingRange'))throw Error('[R1830] final office range handlers missing');
if(!html.includes(camera))throw Error('[R1830] camera-only selection guard missing');
write('dist/api/equipment-rental-portal.html',html);
execFileSync(process.execPath,['--check','apps/store-desktop/desktop-overlay.js'],{stdio:'inherit'});
console.log('[R1830] camera office selection on web/Windows, inclusive calendar range, invoice preserved; Windows halo disabled');
