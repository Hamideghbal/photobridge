/* R1698: activate the two user-approved compact receipts in both site and native UI.
 * Must run AFTER R1687 and its tests. No other finance/print routes change.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1698 '+label+' count '+n);return s.replace(a,b);};
const renderer=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
if(!renderer.includes('function pbR1698ApprovedThermal(')||!renderer.includes('function pbR1698Words('))
 throw Error('R1698 renderer source missing');
const oldCall='pb1674DirectCustomer(t)?pb1674CustomerThermal(t):pb1665Thermal(t,a)';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';
 let js=fs.readFileSync(file,'utf8');
 js=one(js,'function Vy(t,a){',renderer+'\nfunction Vy(t,a){','insert renderer '+root);
 js=one(js,oldCall,'pbR1698ApprovedThermal(t,pb1674DirectCustomer(t))','activate print '+root);
 fs.writeFileSync(file,js);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const page=root+'/index.html';let html=fs.readFileSync(page,'utf8'),hits=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,u=>{hits++;return u+'&approvedThermal=r1708';});
 if(hits!==1)throw Error('R1698 cache reference '+root+' '+hits);
 fs.writeFileSync(page,html);
 if(root.endsWith('/lab-desktop-ui')){
  const fileManifest=root+'/manifest.json',m=JSON.parse(fs.readFileSync(fileManifest,'utf8'));
  if(m.channel!=='lab'||m.protocol!==1||!Array.isArray(m.files))throw Error('R1698 unexpected manifest');
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
   const record=m.files.find(x=>x.name===name);if(!record)throw Error('R1698 missing manifest '+name);
   record.sha256=sha(fs.readFileSync(root+'/'+name));
  }
  m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  fs.writeFileSync(fileManifest,JSON.stringify(m));
 }
}
console.log('[R1698] Approved compact 80mm receipts active in website and Windows UI snapshot.');
