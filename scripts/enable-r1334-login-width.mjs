import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const asset='photobridge-r1334-login-width.css';
function walk(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);if(item.isDirectory()){walk(file);continue;}if(!item.name.endsWith('.html'))continue;
 let html=fs.readFileSync(file,'utf8');if(!html.includes('photobridge-r1126-desktop-navigation.js')&&!html.includes('id="loginView"'))continue;
 const prefix=html.match(/src=["']([^"']*)photobridge-r1126-desktop-navigation\.js/)?.[1]??'/';
 // Load before first paint; :root specificity keeps later legacy fit styles from widening it.
 html=html.replace(/<link rel="stylesheet" href="[^"<>]*photobridge-r1334-login-width\.css[^"<>]*">/g,'');
 if(!html.includes('</head>'))throw Error('R1334 missing head '+file);
 html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}${asset}?v=r1334"></head>`);
 fs.writeFileSync(file,html);
 if(prefix==='./'||prefix==='')fs.copyFileSync('dist/web/'+asset,path.join(dir,asset));
}}
walk('dist/web');walk('dist/api');
for(const channel of ['desktop-ui','lab-desktop-ui']){
 const root=path.resolve('dist/web',channel),manifestPath=path.join(root,'manifest.json');if(!fs.existsSync(manifestPath))continue;
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(!manifest.files.some(entry=>entry.name===asset))manifest.files.push({name:asset,url:`/${channel}/${asset}`,sha256:''});
 for(const entry of manifest.files){const file=path.resolve(root,entry.name);if(!file.startsWith(root+path.sep))throw Error('Invalid desktop manifest path');entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
 manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log('[R1334] Consistent narrower photographer, lab and store login frames.');
