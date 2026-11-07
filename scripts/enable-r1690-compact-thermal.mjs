/* R1690: user-approved compact thermal print for customers and photographers.
 * Applied after R1687; does not modify A4/PDF, invoice totals, or business classification.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const snippet=zlib.gunzipSync(Buffer.from(fs.readFileSync('scripts/r1690-compact-thermal.js.gz.b64','utf8').trim(),'base64')).toString('utf8');
if(!snippet.includes('function pb1690CompactThermal(t){')||!snippet.includes('pb1674CustomerThermal=pb1690CompactThermal'))throw Error('R1690 template missing');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(file,'utf8');
 if(!js.includes('function pb1674CustomerThermal(t){')||!js.includes('function pb1665Thermal(t,a){'))throw Error('R1690 original thermal functions missing '+root);
 if(!js.includes('/* R1690: approved compact framed 80mm thermal template')){
  const anchor='function Vy(t,a){';if(js.split(anchor).length!==2)throw Error('R1690 invoice insertion anchor '+root);
  js=js.replace(anchor,snippet+'\n'+anchor);fs.writeFileSync(file,js);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const page=root+'/index.html';let html=fs.readFileSync(page,'utf8');let count=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,value=>{count++;return value.includes('&compactThermal=r1690')?value:value+'&compactThermal=r1690'});
 if(count!==1)throw Error('R1690 entrypoint '+root+' '+count);fs.writeFileSync(page,html);
 if(root.endsWith('lab-desktop-ui')){
  const mp=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(mp,'utf8'));
  if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1690 wrong native manifest');
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const item=manifest.files.find(x=>x.name===name);if(!item)throw Error('R1690 native file missing '+name);
   item.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(mp,JSON.stringify(manifest));
 }
}
console.log('[R1690] Compact framed customer/photographer thermal invoices applied to web and lab desktop UI');
