import fs from 'node:fs';
for(const [file,asset]of [['dist/web/lab-site-editor.html','lab-site-editor.js'],['dist/web/lab-site-editor.html','equipment-site-editor.js'],['dist/web/storefront.html','storefront-rental.js'],['dist/web/storefront.html','storefront.js']])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(new RegExp(asset.replaceAll('.','\\.')+'\\?v=[^"\']+','g'),asset+'?v=r1273'));
console.log('[R1273] Per-text style editor, equipment albums and compact rental login refreshed.');
