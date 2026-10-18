import fs from 'node:fs';
const p='dist/web/index.html';let html=fs.readFileSync(p,'utf8');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&labSettings=[^&"']*/g,'')+'&labSettings=r1296');
for(const asset of ['photobridge-r1137-lab-local-intake.js','photobridge-r1291-lab-account-picker.css'])html=html.replace(new RegExp('('+asset.replaceAll('.','\\.')+'\\?[^"\']*)','g'),u=>u.replace(/&settings=[^&"']*/g,'')+'&settings=r1296');
fs.writeFileSync(p,html);
