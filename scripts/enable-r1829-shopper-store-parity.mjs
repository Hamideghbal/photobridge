// R1829: storefront-only (photographer entering camera equipment store).
// The Lab portal and frame/chassis store UI remain unchanged.
import fs from 'node:fs';
const file='dist/api/equipment-rental-book.html';
let html=fs.readFileSync(file,'utf8');
const urls=[
 ['/photobridge-r1829-shopper-store-parity.css?v=r1829','link'],
 ['/photobridge-r1829-shopper-store-parity.js?v=r1829','script']
];
for(const [url,type] of urls){
 const tag=type==='link'?'<link rel="stylesheet" href="'+url+'">':'<script defer src="'+url+'"></script>';
 if(!html.includes(tag)){
  const end=html.lastIndexOf('</body>');
  if(end<0)throw Error('[R1829] storefront HTML missing closing body');
  html=html.slice(0,end)+tag+'\n'+html.slice(end);
 }
 if(html.split(tag).length!==2)throw Error('[R1829] duplicate storefront resource '+url);
}
fs.writeFileSync(file,html,'utf8');
console.log('[R1829] scoped photographer camera Store header and sales-tab parity installed');
