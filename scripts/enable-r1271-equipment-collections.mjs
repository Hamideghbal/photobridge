import fs from 'node:fs';
for(const [file,asset]of [['dist/web/lab-site-editor.html','lab-site-editor.js'],['dist/web/storefront-management.html','storefront-management.js']])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\']+','g'),asset+'?v=r1271'));
console.log('[R1271] Equipment service cards, photo galleries and FAQ editor refreshed.');
