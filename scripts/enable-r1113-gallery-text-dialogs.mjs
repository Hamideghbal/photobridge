import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(file,'utf8');
for(const name of ['W0','G0','q0','V0']){
 const start=js.indexOf('function '+name+'('),end=js.indexOf('function ',start+10);
 if(start<0||end<0)throw Error('Gallery component anchor missing: '+name);
 const section=js.slice(start,end).replace('T=C=>{confirm(', 'T=async C=>{confirm(').replace('onClick:()=>{confirm(', 'onClick:async()=>{confirm(').replace(/\bconfirm\(/g,'await window.pb1113GalleryConfirm(').replace(/\balert\(/g,'window.pb1113GalleryNotice(');
 js=js.slice(0,start)+section+js.slice(end);
}
fs.writeFileSync(file,js);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8').replace(/index-UIRefine-v655-r84.js\?v=[^"']+/g,'index-UIRefine-v655-r84.js?v=r1113');
 if(!html.includes('/photobridge-r1113-gallery-text.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1113-gallery-text.css?v=r1113">\n<script defer src="/photobridge-r1113-gallery-dialogs.js?v=r1113"></script>\n</head>');
 fs.writeFileSync(file,html);
}
