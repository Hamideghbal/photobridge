import fs from 'node:fs';
import crypto from 'node:crypto';

const cssFile='photobridge-r1635-photographer-inline-settings.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  fs.copyFileSync('scripts/r1635-photographer-inline-settings.css',root+'/'+cssFile);
  fs.copyFileSync('scripts/r1635-photographer-inline-settings.js',root+'/photobridge-r1635-photographer-inline-settings.js');
  const navigation=root+'/photobridge-r1126-desktop-navigation.js';
  let nav=fs.readFileSync(navigation,'utf8');
  const before="const controls=pb1631Finance?[...doc.querySelectorAll('.financeSectionTabs>button')]:[];";
  const after="const controls=pb1631Finance?['فاکتورها','حساب معین','دریافت‌ها'].map(label=>[...doc.querySelectorAll('.financeSectionTabs>button')].find(button=>button.textContent.trim()===label)).filter(Boolean):[];";
  if(nav.includes(before))nav=nav.replace(before,after);else if(!nav.includes(after))throw Error('R1635 finance controls anchor');
  fs.writeFileSync(navigation,nav);
  const path=root+'/index.html';
  let html=fs.readFileSync(path,'utf8');

  if(!html.includes('</head>'))throw Error('R1635 missing head: '+path);
  if(!html.includes(cssFile))html=html.replace('</head>',`<link rel="stylesheet" href="/${cssFile}?v=r1636"><script defer src="/photobridge-r1635-photographer-inline-settings.js?v=r1636"></script></head>`);
  fs.writeFileSync(path,html);
}
// The Windows Lab bundle's manifest must keep its file hashes consistent with
// the exact files the verified native UI updater will retrieve.
const root='dist/web/lab-desktop-ui';
const manifestPath=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const name of ['index.html',cssFile,'photobridge-r1635-photographer-inline-settings.js','photobridge-r1126-desktop-navigation.js']){
  let row=manifest.files.find(file=>file.name===name);
  if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row)}
  row.sha256=sha256(fs.readFileSync(root+'/'+name));
}
manifest.build=sha256(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestPath,JSON.stringify(manifest));
