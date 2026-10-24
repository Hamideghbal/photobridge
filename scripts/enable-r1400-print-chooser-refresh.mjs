import fs from 'node:fs';
const file='dist/web/index.html';let s=fs.readFileSync(file,'utf8');let found=false;s=s.replace(/(photobridge-v904r99-lab-chooser\.js\?[^"']*)/g,u=>{found=true;return u.includes('&reviewRefresh=')?u:u+'&reviewRefresh=r1400'});if(!found)throw Error('R1400 missing print chooser entry');fs.writeFileSync(file,s);
