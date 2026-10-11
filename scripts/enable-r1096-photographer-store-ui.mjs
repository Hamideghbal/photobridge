// R1096: attach channel visibility and legibility to real photographer storefront.
import fs from 'node:fs';
const file='dist/api/equipment-rental-book.html';
let html=fs.readFileSync(file,'utf8');
for(const url of [
 '/photobridge-r1096-photographer-store.css?v=1096',
 '/photobridge-r1096-photographer-store.js?v=1096'
]){
 const css=url.endsWith('.css?v=1096');
 const tag=css?'<link rel="stylesheet" href="'+url+'">':'<script defer src="'+url+'"></script>';
 if(!html.includes(tag)){
  const close=html.lastIndexOf('</body>');
  if(close<0)throw Error('[R1096] Missing photographer storefront body');
  html=html.slice(0,close)+tag+'\n'+html.slice(close);
 }
 if(html.split(tag).length!==2)throw Error('[R1096] Duplicate or missing storefront UI resource: '+url);
}
fs.writeFileSync(file,html,'utf8');
console.log('[PhotoBridge R1096] photographer storefront channel visibility and readable CSS prepared');
