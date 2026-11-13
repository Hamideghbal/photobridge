/* R1833 photographer camera Store header controls and filter layout; no lab/frame changes. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
function once(s,from,to,label){const n=s.split(from).length-1;if(n!==1)throw Error('[R1833] '+label+' anchor count '+n);return s.replace(from,to)}
const navPath='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=read(navPath);
nav=once(nav,'  row.hidden=choosing;', "  row.hidden=choosing||(active==='store'&&!storeHeader);",'store subheader hidden while shop selection is loading');
nav=once(nav,
 "  const visible=sources.filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&!el.classList.contains('photographerPrintModeBack'));",
 "  const visible=sources.filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&!el.classList.contains('photographerPrintModeBack')&&(active!=='store'||Boolean(el.dataset.storePanel)));",
 'restrict Store tabs to Store controls');
nav=once(nav,
 '   for(const original of storeHeader?[]:visible){',
 "   for(const original of (active==='store'||storeHeader)?[]:visible){",
 'prevent lab/photographer utility chips leaking into Store tab');
if(!nav.includes('if(cameraStore)row.append(nav)'))throw Error('[R1833] R1831 camera-only Store navigation missing');
new Function(nav);
write(navPath,nav);
const book='dist/api/equipment-rental-book.html';
let html=read(book);
html=once(html,
 "function showMobilePanel(id){\n $$('.rentalPanel').forEach(p=>p.classList.toggle('mobileActive',p.id===id));",
 "function showMobilePanel(id){\n const activeShop=typeof selectedShopRecord==='function'?selectedShopRecord():null;\n const isCamera=['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(activeShop?.business_category||''));\n document.body.classList.toggle('pb1833CameraStore',isCamera);\n $$('.rentalPanel').forEach(p=>p.classList.toggle('mobileActive',p.id===id));",
 'selected equipment Store must keep its active panel');
html=once(html,
 "closeRentalRequestV809();await loadBookings();renderItems();showMobilePanel('bookingsPanel')",
 "closeRentalRequestV809();await loadBookings();renderItems();const currentStore=selectedShopRecord();const stayInStore=['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(currentStore?.business_category||''));showMobilePanel(stayInStore?'equipmentPanel':'bookingsPanel')",
 'camera photographer remains in equipment Store after successful rental order');
if(html.includes('pb1833CameraStoreFilterStyle'))throw Error('[R1833] already patched');
const end=html.lastIndexOf('</body>');
if(end<0||html.lastIndexOf('</html>')<end)throw Error('[R1833] valid Store HTML closing tags missing');
html=html.slice(0,end)+'<style id="pb1833CameraStoreFilterStyle">'+read('scripts/r1833-camera-store-filters.css')+'</style>\n'+html.slice(end);
write(book,html);
execFileSync(process.execPath,['--check',navPath],{stdio:'inherit'});
console.log('[R1833] camera Store tabs only; category/brand filters stay within selected panel, without overlap');
