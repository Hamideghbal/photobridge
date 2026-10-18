import fs from 'node:fs';
const file='dist/web/index.html';let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"']*)/g,u=>u.replace(/&initialDebt=[^&"']*/g,'')+'&initialDebt=r1299');fs.writeFileSync(file,html);
