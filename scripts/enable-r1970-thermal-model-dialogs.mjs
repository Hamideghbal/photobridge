import fs from 'node:fs';
import crypto from 'node:crypto';
const one=(s,a,b,label)=>{if(s.split(a).length!==2)throw Error('R1970 '+label+' anchor');return s.replace(a,b)};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
 if(!ui.includes('/* PB1970: editable model fields')){
  for(const name of ['PB1791ModelNameDialog','PB1777FrameModelEditor']){
   const start=ui.indexOf('function '+name+'('),end=ui.indexOf('\nfunction ',start+10);
   if(start<0||end<0)throw Error('R1970 '+name+' bounds');
   const part=ui.slice(start,end);
   const fixed=one(one(part,'return e.jsx(On,{','return e.jsx(PB1970ModelDialogShell,{',name+' shell'),',onClose,children:',',onClose,busy,children:',name+' busy');
   ui=ui.slice(0,start)+fixed+ui.slice(end);
  }
  ui+='\n'+fs.readFileSync('scripts/r1970-model-dialog-shell.js.txt','utf8');
  fs.writeFileSync(file,ui);
 }
 const css='photobridge-r1970-model-dialog.css';if(root!=='dist/web')fs.copyFileSync('dist/web/'+css,root+'/'+css);
 const page=root+'/index.html';let html=fs.readFileSync(page,'utf8');if(!html.includes(css))html=html.replace('</head>','<link rel="stylesheet" href="/'+css+'?v=r1970"></head>');html=html.replace(/index-UIRefine-v655-r84\.js\?[^\"']*/g,url=>url.replace('&models=r1970','').replace('&albumSizes=r1960','&models=r1970&albumSizes=r1960'));fs.writeFileSync(page,html);
 if(root.endsWith('/lab-desktop-ui')){
  const mp=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(mp,'utf8'));
  for(const name of [css,'index.html','assets/index-UIRefine-v655-r84.js']){
   const sha256=crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex');
   const row=manifest.files.find(f=>f.name===name);if(row)row.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
  }
  manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');fs.writeFileSync(mp,JSON.stringify(manifest));
 }
}
console.log('[R1970] model name/color dialogs own native keyboard focus in web and Windows snapshot');
