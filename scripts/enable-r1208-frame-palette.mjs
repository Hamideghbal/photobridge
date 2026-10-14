import fs from 'node:fs';
// Make the deployed portal and storefront request the palette revision.
for(const name of ['dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(name,'utf8');
 for(const asset of ['frame-catalog','frame-owner','frame-store'])html=html.replaceAll('photobridge-r1207-'+asset+'.js?v=r1207','photobridge-r1207-'+asset+'.js?v=r1210-shared-cards').replaceAll('photobridge-r1207-'+asset+'.js?v=r1209-size-prices','photobridge-r1207-'+asset+'.js?v=r1210-shared-cards').replaceAll('photobridge-r1207-'+asset+'.js?v=r1208-palette','photobridge-r1207-'+asset+'.js?v=r1210-shared-cards');
 fs.writeFileSync(name,html);
}
console.log('[R1210] Shared owner/customer model cards with registered photos and selectors.');
