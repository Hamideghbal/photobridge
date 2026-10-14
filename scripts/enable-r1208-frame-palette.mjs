import fs from 'node:fs';
// Make the deployed portal and storefront request the palette revision.
for(const name of ['dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(name,'utf8');
 for(const asset of ['frame-catalog','frame-owner','frame-store'])html=html.replaceAll('photobridge-r1207-'+asset+'.js?v=r1207','photobridge-r1207-'+asset+'.js?v=r1216-mobile').replaceAll('photobridge-r1207-'+asset+'.js?v=r1209-size-prices','photobridge-r1207-'+asset+'.js?v=r1216-mobile').replaceAll('photobridge-r1207-'+asset+'.js?v=r1211-color-photos','photobridge-r1207-'+asset+'.js?v=r1216-mobile').replaceAll('photobridge-r1207-'+asset+'.js?v=r1210-shared-cards','photobridge-r1207-'+asset+'.js?v=r1216-mobile').replaceAll('photobridge-r1207-'+asset+'.js?v=r1208-palette','photobridge-r1207-'+asset+'.js?v=r1216-mobile');
 html=html.replaceAll('photobridge-r1172-production-owner.js?v=r1207','photobridge-r1172-production-owner.js?v=r1212c-toman');
 html=html.replaceAll('photobridge-r1207-frame-catalog.js?v=r1212c-toman','photobridge-r1207-frame-catalog.js?v=r1216-mobile').replaceAll('photobridge-r1207-frame-store.js?v=r1212c-toman','photobridge-r1207-frame-store.js?v=r1216-mobile');
 html=html.replaceAll('photobridge-v904r100f43-store-mobile-header-cleanup.js?v=904r100f43','photobridge-v904r100f43-store-mobile-header-cleanup.js?v=r1216-mobile');
 fs.writeFileSync(name,html);
}
console.log('[R1212] Model details, color galleries and size-only prices.');
