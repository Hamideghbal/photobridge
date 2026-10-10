// R1092: delete the obsolete, standalone Windows alert-agent setup card
// from the real prebuilt equipment rental portal, not merely CSS-hide it.
// This intentionally keeps the separate native Store Windows download below.
import fs from 'node:fs';
const filename='dist/api/equipment-rental-portal.html';
let html=fs.readFileSync(filename,'utf8');
const begin='<div class="box pb842WindowsAlertBox">';
const next='<div class="box"><h2>مشخصات فروشگاه</h2>';
const start=html.indexOf(begin);
if(start!==-1){
 const end=html.indexOf(next,start);
 if(end<0||end-start>7000||!html.slice(start,end).includes('id="createRentalAlertAgent"')||
 !html.slice(start,end).includes('id="downloadRentalAlertAgent"'))
    throw Error('[R1092] Legacy alert setup section changed; refusing unsafe HTML removal');
 html=html.slice(0,start)+html.slice(end);
 fs.writeFileSync(filename,html,'utf8');
}
if(html.includes(begin)||html.includes('id="createRentalAlertAgent"'))
 throw Error('[R1092] Obsolete Windows alert panel was not fully removed');
if(!html.includes(next)||!html.includes('id="shopForm"'))
 throw Error('[R1092] Store settings contents missing after cleanup');
console.log('[PhotoBridge R1092] obsolete Windows alert installation / pairing panel removed from Store settings');
