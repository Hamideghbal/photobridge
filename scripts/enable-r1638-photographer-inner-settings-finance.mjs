import fs from 'node:fs';
import crypto from 'node:crypto';

// R1638 is a late stylesheet in BOTH site and Windows UI payloads.
// Keep existing React handlers, finance data and API untouched.
const fileName='photobridge-r1638-photographer-inner-settings-finance.css';
for (const root of ['dist/web','dist/web/lab-desktop-ui']) {
  fs.copyFileSync('scripts/r1638-photographer-inner-settings-finance.css',root+'/'+fileName);
  const index=root+'/index.html';
  let html=fs.readFileSync(index,'utf8');
  if(!html.includes('</head>'))throw Error('R1638 missing head: '+index);
  if(html.includes(fileName))throw Error('R1638 duplicate stylesheet: '+index);
  html=html.replace('</head>','<link rel="stylesheet" href="/'+fileName+'?v=r1638"></head>');
  fs.writeFileSync(index,html);
}
// The Windows updater validates exact file hashes and the derived build token.
const root='dist/web/lab-desktop-ui',manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
for (const name of ['index.html',fileName]) {
  let item=manifest.files.find(f=>f.name===name);
  if(!item){item={name,url:'/lab-desktop-ui/'+name};manifest.files.push(item)}
  item.sha256=sha256(fs.readFileSync(root+'/'+name));
}
manifest.build=sha256(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
