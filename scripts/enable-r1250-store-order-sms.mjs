import fs from 'node:fs';

for (const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']) {
    let html=fs.readFileSync(file,'utf8');
    html=html.replace(/(photobridge-r(?:1126-desktop-navigation|1207-frame-(?:catalog|store))\.js\?[^"']*)/g, value => value.replace(/&orders=[^&"']*/g,'')+'&orders=r1250');
    fs.writeFileSync(file,html);
}
console.log('[R1250] Store order SMS and compact frame assets versioned');
