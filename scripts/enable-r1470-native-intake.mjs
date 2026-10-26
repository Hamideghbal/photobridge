import fs from 'node:fs';import {execFileSync} from 'node:child_process';
fs.copyFileSync('scripts/r1466-intake-move.js','dist/web/photobridge-r1466-intake-move.js');
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(path,'utf8');html=html.replace(/(photobridge-r1466-intake-move\.js\?[^"'\s]*)/g,url=>url.includes('nativeSource=r1470')?url:url+'&nativeSource=r1470');fs.writeFileSync(path,html);}
execFileSync(process.execPath,['--check','dist/web/photobridge-r1466-intake-move.js'],{stdio:'inherit'});
