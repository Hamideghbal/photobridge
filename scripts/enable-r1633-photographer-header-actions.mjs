import fs from 'node:fs';
import crypto from 'node:crypto';

const cssFile='photobridge-r1633-photographer-header-actions.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  fs.copyFileSync('scripts/r1633-photographer-header-actions.css',root+'/'+cssFile);
  const path=root+'/index.html';
  let html=fs.readFileSync(path,'utf8');
  if(html.includes(cssFile))throw Error('R1633 duplicate stylesheet: '+path);
  if(!html.includes('</head>'))throw Error('R1633 missing head: '+path);
  html=html.replace('</head>',`<link rel="stylesheet" href="/${cssFile}?v=r1633"></head>`);
  fs.writeFileSync(path,html);
}
// The Windows Lab bundle's manifest must keep its file hashes consistent with
// the exact files the verified native UI updater will retrieve.
const root='dist/web/lab-desktop-ui';
const manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const name of ['index.html',cssFile]){
  let row=manifest.files.find(file=>file.name===name);
  if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row)}
  row.sha256=sha256(fs.readFileSync(root+'/'+name));
}
manifest.build=sha256(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
