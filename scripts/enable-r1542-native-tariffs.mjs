import fs from 'node:fs';
import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const css='photobridge-r1542-native-tariffs.css',nav='photobridge-r1372-third-header.js';
// A cached customer pane remains connected while walk-in is open. Its React
// handler changes the hidden pane only. Route every promoted tab explicitly;
// the customer component already subscribes to popstate and hashchange.
const old='button.onclick=()=>{const live=root.querySelectorAll(\'.labCustomerSubnav>button\')[index];if(index<3&&live){live.click();return}if(location.pathname!==path){history.pushState(null,\'\',path);dispatchEvent(new PopStateEvent(\'popstate\'));}};';
const fixed='/* PB1542 customer tabs use canonical routes */button.onclick=()=>{if(location.pathname!==path||location.hash){history.pushState(null,\'\',path);dispatchEvent(new PopStateEvent(\'popstate\'));}};';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+nav;let s=fs.readFileSync(file,'utf8');if(!s.includes('PB1542 customer tabs use canonical routes')){if(s.split(old).length!==2)throw Error('R1542 customer navigation anchor changed: '+root);s=s.replace(old,fixed);fs.writeFileSync(file,s);}
 if(root.endsWith('lab-desktop-ui'))fs.copyFileSync('dist/web/'+css,root+'/'+css);
 let html=fs.readFileSync(root+'/index.html','utf8');if(!html.includes(css))html=html.replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1542"></head>`);
 html=html.replace(/(photobridge-r1372-third-header\.js\?[^"']*)/g,u=>u.includes('&customerRoutes=r1542')?u:u+'&customerRoutes=r1542');fs.writeFileSync(root+'/index.html',html);
}
const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1542 native contract changed');
for(const name of [css,nav,'index.html']){const sha256=hash(fs.readFileSync(root+'/'+name)),entry=manifest.files.find(f=>f.name===name);if(entry)entry.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));
console.log('[PhotoBridge R1542] full-shell tariff alignment and canonical customer navigation');
