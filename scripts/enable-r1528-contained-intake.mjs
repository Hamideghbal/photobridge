import fs from 'node:fs';
const css='dist/web/photobridge-r1137-lab-local-intake.css',extra=fs.readFileSync('scripts/r1528-contained-intake.css','utf8');let text=fs.readFileSync(css,'utf8');if(!text.includes('/* PB1528 contained intake'))fs.writeFileSync(css,text+extra);
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(photobridge-r1137-lab-local-intake\.css\?[^"']*)/g,url=>url.includes('&layout=r1528')?url:url+'&layout=r1528');fs.writeFileSync(index,html);
