// R1095: attach the two UI controllers to the real prebuilt HTML used by web and Windows.
import fs from 'node:fs';
for(const [file,url] of [
 ['dist/api/equipment-rental-portal.html','/photobridge-r1095-owner-stock.js?v=1097'],
 ['dist/api/equipment-rental-book.html','/photobridge-r1095-customer-stock.js?v=1098']
]){
 let src=fs.readFileSync(file,'utf8'),tag='<script defer src="'+url+'"></script>';
 const asset=url.split('?')[0];
 for(const version of [1095,1097])if(url!==asset+'?v='+version)src=src.replaceAll('<script defer src="'+asset+'?v='+version+'"></script>','');
 while(src.split(tag).length>2)src=src.replace(tag,'');
 if(!src.includes(tag)){
  const at=src.lastIndexOf('</body>');
  if(at<0)throw Error('[R1095] missing closing body: '+file);
  src=src.slice(0,at)+tag+'\n'+src.slice(at);
 }
 if(src.split(tag).length!==2)throw Error('[R1095] duplicate or missing script: '+file);
 fs.writeFileSync(file,src,'utf8');
}
const book='dist/api/equipment-rental-book.html';
let customer=fs.readFileSync(book,'utf8');
const note='تا آن زمان این درخواست از موجودی فروشگاه کم نمی‌کند.';
if(customer.includes(note)){
 customer=customer.replace(note,'این درخواست تا اعلام نتیجه توسط فروشگاه هنوز تأیید نهایی نشده است.');
 fs.writeFileSync(book,customer,'utf8');
}
console.log('[R1095] store and customer stock-mode controls attached');
