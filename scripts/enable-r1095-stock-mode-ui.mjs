// R1095: attach the two UI controllers to the real prebuilt HTML used by web and Windows.
import fs from 'node:fs';
for(const [file,url] of [
 ['dist/api/equipment-rental-portal.html','/photobridge-r1095-owner-stock.js?v=1095'],
 ['dist/api/equipment-rental-book.html','/photobridge-r1095-customer-stock.js?v=1095']
]){
 let src=fs.readFileSync(file,'utf8'),tag='<script defer src="'+url+'"></script>';
 if(!src.includes(tag)){
  const at=src.lastIndexOf('</body>');
  if(at<0)throw Error('[R1095] missing closing body: '+file);
  src=src.slice(0,at)+tag+'\n'+src.slice(at);
  fs.writeFileSync(file,src,'utf8');
 }
 if(src.split(tag).length!==2)throw Error('[R1095] duplicate or missing script: '+file);
}
console.log('[R1095] store and customer stock-mode controls attached');
