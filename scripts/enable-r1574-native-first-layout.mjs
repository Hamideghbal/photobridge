// Native-only: select the existing full-width layout before React's first paint.
import fs from 'node:fs';import crypto from 'node:crypto';
const root='dist/web/lab-desktop-ui',file=root+'/index.html';let html=fs.readFileSync(file,'utf8');
const script=`<script>/* R1574 native first layout */(()=>{if(/^\\/lab\\/(?:orders|album|archive|finance|settings|wallet)(?:\\/|$)/.test(location.pathname)&&matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches)document.documentElement.classList.add('pb1363OrderQueue')})();</script>`;
if(!html.includes('R1574 native first layout'))html=html.replace('<head>','<head>\n'+script);if(!html.includes(script))throw Error('R1574 native head anchor missing');fs.writeFileSync(file,html);
const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath)),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
manifest.files.find(x=>x.name==='index.html').sha256=sha(html);manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(manifestPath,JSON.stringify(manifest));
