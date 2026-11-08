// R1713 — inject only the read-only store finance backup entry.
// Do not replace order archives, or touch Lab's backup and Windows installers.
import fs from 'node:fs';
const portal='dist/api/equipment-rental-portal.html';
let html=fs.readFileSync(portal,'utf8');
const tag='<script defer src="/photobridge-r1713-store-backup-entry.js?v=r1713"></script>';
if(!html.includes(tag)){
 const end=html.lastIndexOf('</body>');
 if(end<0)throw Error('R1713 store portal body missing');
 html=html.slice(0,end)+tag+html.slice(end);
 fs.writeFileSync(portal,html);
}
for(const file of ['dist/web/store-finance-backup.html','dist/web/photobridge-r1713-store-finance-backup.js','dist/web/photobridge-r1713-store-backup-entry.js']){
 if(!fs.existsSync(file))throw Error('R1713 missing '+file);
}
console.log('[R1713] Store finance readable backup page and Settings link present; no archive backup');