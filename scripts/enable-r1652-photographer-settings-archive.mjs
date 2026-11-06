/* R1652: late CSS-only photographer settings scroll and laboratory archive parity.
 * Runs AFTER R1651 invoice iframe host and R1649 album-card layout.
 * Does not modify React, server, lab finance or print-photo CSS.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
const stylesheet='photobridge-r1652-photographer-settings-archive.css';
const source=fs.readFileSync('scripts/r1652-photographer-settings-archive.css','utf8');
if(!source.includes('.standalonePhotographerSettings')||
 !source.includes('.photographerLocationSettings')||
 !source.includes('.photographerPricingSettings')||
 !source.includes('.photographerArchiveWorkspace')||
 !source.includes('min-height:45px!important'))
 throw Error('R1652 expected photographer settings/archive scoped selectors');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const cssPath=root+'/'+stylesheet;
 fs.writeFileSync(cssPath,source);
 const index=root+'/index.html';
 let html=fs.readFileSync(index,'utf8');
 const marker='/'+stylesheet+'?v=r1652';
 const count=html.split(marker).length-1;
 if(count>1)throw Error('R1652 duplicate stylesheet '+root);
 if(count===0){
  if(!html.includes('</head>'))throw Error('R1652 missing head '+root);
  html=html.replace('</head>','<link rel="stylesheet" href="'+marker+'"></head>');
 }
 fs.writeFileSync(index,html);
 if(root.endsWith('/lab-desktop-ui')){
  const path=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(path,'utf8'));
  if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))
   throw Error('R1652 native manifest invalid');
  for(const name of ['index.html',stylesheet]){
   let row=manifest.files.find(f=>f.name===name);
   if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row);}
   row.sha256=sha(fs.readFileSync(root+'/'+name));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=sha(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(path,JSON.stringify(manifest));
 }
}
console.log('[R1652] Photographer tariff/location scroll and lab-sized archive calendar CSS installed');