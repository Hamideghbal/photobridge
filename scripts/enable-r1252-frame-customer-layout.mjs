import fs from 'node:fs';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/(photobridge-r(?:1126-desktop-navigation\.js|1207-frame-store\.js|1242-frame-payments\.js|1245-frame-customer-ux\.css)\?[^"']*)/g,value=>value.replace(/&layout=[^&"']*/g,'')+'&layout=r1252');
 fs.writeFileSync(file,html);
}
console.log('[R1252] Customer frame layout assets versioned');
