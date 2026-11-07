/* R1657: photographer finance heading cleanup and single mobile mode alignment.
 * Cosmetic-only: never patch compiled React, routes, invoices or lab finance.
 * Install after R1655 navigation recovery so that working tab handlers survive.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const stylesheet='photobridge-r1657-photographer-finance-mobile-tab.css';
const controller='photobridge-r1657-photographer-mobile-single-tab.js';
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const src=fs.readFileSync('scripts/r1657-photographer-finance-mobile-tab.css','utf8');
if(!src.includes('.financeWorkspace.financeWorkspaceCompact')||
   !src.includes('.sectionTopline.financeTopline')||
   !src.includes('data-pb1657-single="1"')||
   !src.includes('@media (max-width:820px)'))
 throw Error('R1657 expected photographer-only style contracts');
execFileSync(process.execPath,['--check','scripts/r1657-photographer-mobile-single-tab.js'],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 fs.copyFileSync('scripts/r1657-photographer-finance-mobile-tab.css',root+'/'+stylesheet);
 const native=root.endsWith('/lab-desktop-ui');
 if(!native)fs.copyFileSync('scripts/r1657-photographer-mobile-single-tab.js',root+'/'+controller);
 const indexPath=root+'/index.html';
 let html=fs.readFileSync(indexPath,'utf8');
 if(!html.includes('</head>')||html.includes('/'+stylesheet+'?'))throw Error('R1657 CSS asset placement '+root);
 let tags='<link rel="stylesheet" href="/'+stylesheet+'?v=r1657">';
 if(!native){
  if(html.includes('/'+controller+'?'))throw Error('R1657 duplicate mobile script '+root);
  tags+='\n<script defer src="/'+controller+'?v=r1657"></script>';
 }
 html=html.replace('</head>',tags+'\n</head>');
 fs.writeFileSync(indexPath,html);
 if(native){
  const manifestPath=root+'/manifest.json';
  const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(m.protocol!==1||m.channel!=='lab'||!Array.isArray(m.files))
   throw Error('R1657 unsupported native manifest');
  for(const name of ['index.html',stylesheet]){
   let entry=m.files.find(file=>file.name===name);
   if(!entry){entry={name,url:'/lab-desktop-ui/'+name};m.files.push(entry);}
   entry.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));
  m.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestPath,JSON.stringify(m));
 }
}
console.log('[R1657] Embedded photographer finance heading hidden; one mobile Print/Album tab centered.');
