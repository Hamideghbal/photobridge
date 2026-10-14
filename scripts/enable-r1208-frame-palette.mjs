import fs from 'node:fs';
// Make the deployed portal and storefront request the palette revision.
for(const name of ['dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(name,'utf8');
 for(const asset of ['frame-catalog','frame-owner','frame-store'])html=html.replaceAll('photobridge-r1207-'+asset+'.js?v=r1207','photobridge-r1207-'+asset+'.js?v=r1208-palette');
 fs.writeFileSync(name,html);
}
console.log('[R1208] Frame model palette and per-combination photos/prices attached.');
