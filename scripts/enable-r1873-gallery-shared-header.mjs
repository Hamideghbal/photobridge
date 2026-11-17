// R1873: use the existing Gallery-style, single mobile photographer header
// in every photographer tab. Do not duplicate React/native action handlers.
import fs from 'node:fs';
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
if(!revision)throw Error('[R1873] missing deploy revision');
const name='photobridge-v904r100f36-shared-header.js';
const script='dist/web/'+name;
if(!fs.existsSync(script)||!fs.readFileSync(script,'utf8').includes('PBSharedPhotographerHeader'))throw Error('[R1873] shared header source missing');
const file='dist/web/index.html';
let html=fs.readFileSync(file,'utf8');
if(!html.includes('/photobridge-r1761-crm-nav.js?'))throw Error('[R1873] CRM mobile navigation must be installed before shared header');
const tag='<script defer src="/'+name+'?rev='+encodeURIComponent(revision)+'"></script>';
if(/<script[^>]+photobridge-v904r100f36-shared-header[.]js[^>]*><\/script>/.test(html))
 html=html.replace(/<script[^>]+photobridge-v904r100f36-shared-header[.]js[^>]*><\/script>/,tag);
else {
 if(!html.includes('</body>'))throw Error('[R1873] index page footer missing');
 html=html.replace('</body>',tag+'</body>');
}
fs.writeFileSync(file,html);
console.log('[R1873] one Gallery style mobile photographer header enabled, '+revision);
