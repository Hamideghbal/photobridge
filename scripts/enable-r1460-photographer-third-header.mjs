import fs from 'node:fs';
const file='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(file,'utf8');
if(!css.includes('/* PB1460 photographer third header */')){css+='\n/* PB1460 photographer third header */\n'+fs.readFileSync('scripts/r1460-photographer-third-header.css','utf8');fs.writeFileSync(file,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.css\?[^"'\s]*)/g,url=>url.includes('thirdHeader=r1460')?url:url+'&thirdHeader=r1460');fs.writeFileSync(file,html)}
console.log('[R1460] Full-width photographer intake toolbar, original Send/Cancel actions and compact quote below.');
