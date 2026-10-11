import fs from 'node:fs';
for(const file of ['dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8');
 if(file.endsWith('equipment-rental-portal.html')){
  const before="if(el.id==='pb848BookingHeaderTabs'&&!['pending','calendar','shortages','returnShortages'].includes(b.dataset.pb843OfficeTab))";
  const after="if(el.id==='pb848BookingHeaderTabs'&&(!['pending','calendar','shortages','returnShortages'].includes(b.dataset.pb843OfficeTab)||(b.dataset.pb843OfficeTab==='shortages'&&data?.shop?.customer_rental_stock_mode==='strict')))";
  if(html.includes(before))html=html.replace(before,after);
  if(!html.includes(after))throw Error('Missing shared navigation stock-mode guard');
 }
 const tag='<link rel="stylesheet" href="/photobridge-r1097-store-readability.css?v=1097">';
 if(!html.includes(tag)){
  const at=html.lastIndexOf('</body>');
  if(at<0)throw Error('Missing storefront body: '+file);
  html=html.slice(0,at)+tag+'\n'+html.slice(at);
 }
 html=html.replaceAll('photobridge-r1057-daily-rental-availability.js?v=r1085','photobridge-r1057-daily-rental-availability.js?v=r1097');
 html=html.replaceAll('photobridge-r1095-owner-stock.js?v=1095','photobridge-r1095-owner-stock.js?v=1097');
 html=html.replaceAll('photobridge-r1095-customer-stock.js?v=1095','photobridge-r1095-customer-stock.js?v=1097');
 fs.writeFileSync(file,html);
}
console.log('[PhotoBridge R1097] Office list scrolling and readable equipment availability prepared');
