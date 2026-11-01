import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';if(!fs.readFileSync(file,'utf8').includes('/* PB1530 acknowledged download transition */'))throw Error('download_transition_not_patched');
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&downloadTransition=r1530')?url:url+'&downloadTransition=r1530');fs.writeFileSync(index,html);
