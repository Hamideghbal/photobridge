// R1097: owner action badges reach browser and Windows desktop's embedded UI.
import fs from 'node:fs';
const file='dist/api/equipment-rental-portal.html';
let html=fs.readFileSync(file,'utf8');
for(const url of ['/photobridge-r1097-shop-attention.css?v=1097','/photobridge-r1097-shop-attention.js?v=1097']){
 const tag=url.includes('.css?')?'<link rel="stylesheet" href="'+url+'">':'<script defer src="'+url+'"></script>';
 if(!html.includes(tag)){
  const pos=html.lastIndexOf('</body>');
  if(pos<0)throw Error('[R1097 attention] owner portal body missing');
  html=html.slice(0,pos)+tag+'\n'+html.slice(pos);
 }
 if(html.split(tag).length!==2)throw Error('[R1097 attention] asset duplicate: '+url);
}
fs.writeFileSync(file,html,'utf8');
console.log('[PB R1097] owner action counters attached to both Store mobile and Windows UI');
