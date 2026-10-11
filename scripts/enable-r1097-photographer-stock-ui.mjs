// R1097: load readable out-of-stock equipment highlights and bust old JS cache.
import fs from 'node:fs';
const file='dist/api/equipment-rental-book.html';
let html=fs.readFileSync(file,'utf8');
const old='<script defer src="/photobridge-r1095-customer-stock.js?v=1095"></script>';
const fresh='<script defer src="/photobridge-r1095-customer-stock.js?v=1095&r=1097"></script>';
if(html.includes(old))html=html.replace(old,fresh);
else if(!html.includes(fresh))throw Error('[R1097] customer stock script missing');
const style='<link rel="stylesheet" href="/photobridge-r1097-photographer-stock.css?v=1097">';
if(!html.includes(style)){
 const at=html.lastIndexOf('</body>');
 if(at<0)throw Error('[R1097] photographer book body missing');
 html=html.slice(0,at)+style+'\n'+html.slice(at);
}
if(html.split(fresh).length!==2||html.split(style).length!==2)throw Error('[R1097] duplicate customer status assets');
fs.writeFileSync(file,html,'utf8');
console.log('[PhotoBridge R1097] red out-of-stock cards, larger booking controls and cache-busted stock JS');
