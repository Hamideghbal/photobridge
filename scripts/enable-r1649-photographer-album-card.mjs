/* R1649: photographer desktop album-card cosmetics, after all preceding CSS.
 * This must not alter print-photo cards, React, invoices or the native Lab UI.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const cssName='photobridge-r1649-photographer-album-card.css';
const original=fs.readFileSync('scripts/r1649-photographer-album-card.css','utf8');
if(!original.includes('.liveOrderCard.albumCustomerOrderCard')||
   !original.includes('grid-template-columns:repeat(6,minmax(0,1fr))!important')||
   !original.includes('border-inline-start:1px solid #dce4ed!important')||
   !original.includes('.albumCoverTextFact')||
   original.includes('.liveOrderCard:not(.albumCustomerOrderCard)'))
 throw Error('R1649 album-only style markers missing or print card targeted');

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const cssFile=root+'/'+cssName;
 fs.writeFileSync(cssFile,original);
 const index=root+'/index.html';
 let html=fs.readFileSync(index,'utf8');
 const marker='/'+cssName+'?v=r1649';
 const matches=html.split(marker).length-1;
 if(matches>1)throw Error('R1649 duplicate stylesheet in '+index);
 if(matches===0){
  if(!html.includes('</head>'))throw Error('R1649 missing head '+index);
  html=html.replace('</head>','<link rel="stylesheet" href="'+marker+'"></head>');
 }
 fs.writeFileSync(index,html);
 if(root.endsWith('/lab-desktop-ui')){
  // Existing native UI updates are SHA-256 verified, including their index.
  const path=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(path,'utf8'));
  if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))
   throw Error('R1649 native manifest changed');
  const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
  for(const name of ['index.html',cssName]){
   let entry=manifest.files.find(f=>f.name===name);
   if(!entry){entry={name,url:'/lab-desktop-ui/'+name};manifest.files.push(entry);}
   entry.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=hash(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(path,JSON.stringify(manifest));
 }
}
console.log('[R1649] Six album facts in one row and centered album stages, print-photo untouched.');
