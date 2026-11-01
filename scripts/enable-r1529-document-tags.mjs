import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';if(!fs.readFileSync(file,'utf8').includes('/* PB1529 document tags and stage hints */'))throw Error('document_tags_not_patched');
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&documentTags=r1529')?url:url+'&documentTags=r1529');fs.writeFileSync(index,html);
