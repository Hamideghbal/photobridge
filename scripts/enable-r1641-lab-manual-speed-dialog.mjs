import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

// R1641 is a late patch on the already prepared website and native Windows payload.
// Do not change financial state transitions, server routes, or source-file deletion policy.
const roots=['dist/web','dist/web/lab-desktop-ui'];
const helper='photobridge-r1466-intake-move.js';
const busyName='photobridge-r1641-native-invoice-busy.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const root of roots){
 fs.copyFileSync('scripts/r1466-intake-move.js',root+'/'+helper);
 const indexPath=root+'/index.html';
 let html=fs.readFileSync(indexPath,'utf8');
 const re=/(photobridge-r1466-intake-move\.js\?[^"'<\s]*)/g;
 let count=0;
 html=html.replace(re,url=>{
   count++;return url.includes('verifySpeed=r1641')?url:url+'&verifySpeed=r1641';
 });
 if(count!==1)throw Error('R1641 missing single intake move asset '+root+' count='+count);
 if(root.endsWith('lab-desktop-ui')){
  fs.copyFileSync('scripts/r1641-native-invoice-busy.js',root+'/'+busyName);
  if(!html.includes(busyName)){
   if(!html.includes('</head>'))throw Error('R1641 native document head not found');
   html=html.replace('</head>',`<script defer src="/${busyName}?v=r1641"></script>\n</head>`);
  }
 }
 fs.writeFileSync(indexPath,html);
 execFileSync(process.execPath,['--check',root+'/'+helper],{stdio:'inherit'});
}
const native='dist/web/lab-desktop-ui';
execFileSync(process.execPath,['--check',native+'/'+busyName],{stdio:'inherit'});
const manifestPath=native+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('R1641 native manifest contract changed');
for(const name of ['index.html',helper,busyName]){
 let item=manifest.files.find(x=>x.name===name);
 if(!item){item={name,url:'/lab-desktop-ui/'+name};manifest.files.push(item)}
 item.sha256=hash(fs.readFileSync(native+'/'+name));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
console.log('[R1641] Manual copy-only order verification reuse; invoice pending buttons restricted to error state; Windows manifest '+manifest.build.slice(0,12));
