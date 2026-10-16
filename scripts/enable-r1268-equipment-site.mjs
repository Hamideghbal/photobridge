import fs from 'node:fs';
const edits=[['dist/api/equipment-rental-portal.html',/photobridge-r1256-storefront-link.js\?v=[^"']+/g,'photobridge-r1256-storefront-link.js?v=r1268'],['dist/web/storefront.html',/\/storefront.js\?v=[^"']+/g,'/storefront.js?v=r1268'],['dist/web/lab-site-editor.html',/\/lab-site-editor.js\?v=[^"']+/g,'/lab-site-editor.js?v=r1268'],['dist/web/storefront-management.html',/\/storefront-management.js\?v=[^"']+/g,'/storefront-management.js?v=r1268']];
for(const [file,pattern,value]of edits){const text=fs.readFileSync(file,'utf8');fs.writeFileSync(file,text.replace(pattern,value));}
console.log('[R1268] Equipment website and shared visual editor assets refreshed.');
