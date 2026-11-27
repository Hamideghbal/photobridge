import fs from 'node:fs';
import zlib from 'node:zlib';
export function patchBook(s){
 if(s.includes('/* PB2098 mobile booking return */'))return s;
 const anchor="closeRentalRequestV809();await loadBookings();renderItems();showMobilePanel('bookingsPanel')";
 if(s.split(anchor).length!==2)throw Error('R2098 mobile booking success anchor missing');
 return s.replace(anchor,`closeRentalRequestV809();/* PB2098 mobile booking return */if(window.matchMedia?.('(max-width:820px)').matches){const submittedShop=shopId;$('#start').value='';$('#end').value='';$('#notes').value='';rentalDateConfirmedKeyV811='';setDefaultDates();$('#quote').innerHTML='';renderItems();showMobilePanel('storePanel');let notice=$('#pb2098BookingSuccess');if(!notice){notice=document.createElement('p');notice.id='pb2098BookingSuccess';notice.setAttribute('role','status');notice.className='msg ok';$('#storePanel').prepend(notice)}notice.textContent='درخواست آفیش ثبت شد؛ منتظر تأیید فروشگاه باشید.';void loadBookings().catch(()=>{});}else{await loadBookings();renderItems();showMobilePanel('bookingsPanel')}`);
}
const file='dist/api/equipment-rental-book.html';
export function run(){const out=patchBook(fs.readFileSync(file,'utf8'));fs.writeFileSync(file,out);const b=Buffer.from(out);for(const [ext,encode] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]])if(fs.existsSync(file+ext))fs.writeFileSync(file+ext,encode(b));console.log('[R2098] mobile booking success returns to selected store home; desktop path unchanged');}
if(process.argv[1]?.endsWith('enable-r2098-mobile-booking-return.mjs'))run();
