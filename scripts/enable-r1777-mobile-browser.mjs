// Final web-only compatibility/login correction; native snapshots remain unchanged.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
for(const ext of ['css','js'])fs.copyFileSync('scripts/r1777-mobile-browser.'+ext,'dist/web/photobridge-r1777-mobile-browser.'+ext);
const file='dist/web/index.html';let html=fs.readFileSync(file,'utf8');
if(!html.includes('photobridge-r1777-mobile-browser.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1777-mobile-browser.css?v=r1777"><script defer src="/photobridge-r1777-mobile-browser.js?v=r1777"></script>\n</head>');
// Content-address the final first-party UI references. Fixed historic v= tokens
// could otherwise mix old cached styles with current markup on different phones.
html=html.replace(/\b(src|href)=(['"])(\/[^'"<>\s]+\.(?:css|js))([^'"<>\s]*)\2/g,(whole,attr,quote,asset,query)=>{
 const local=path.resolve('dist/web','.'+asset),root=path.resolve('dist/web')+path.sep;
 if(!local.startsWith(root)||!fs.existsSync(local))return whole;
 const digest=crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex').slice(0,16);
 const clean=query.replace(/([?&])uiHash=[^&]*/g,'$1').replace(/\?&/g,'?').replace(/&&/g,'&').replace(/[?&]$/,'');
 return attr+'='+quote+asset+clean+(clean.includes('?')?'&':'?')+'uiHash='+digest+quote;
});
fs.writeFileSync(file,html);
console.log('[R1777] Small-phone content modes, separate password toggle and content-addressed web UI.');
