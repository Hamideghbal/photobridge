import fs from 'node:fs';
for(const [file,asset] of [['dist/web/lab-site-editor.html','lab-site-editor.js'],['dist/web/storefront.html','storefront-rental.js']])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\']+','g'),asset+'?v=r1269'));
console.log('[R1269] Equipment dropdown, product shell and logo editor assets refreshed.');
