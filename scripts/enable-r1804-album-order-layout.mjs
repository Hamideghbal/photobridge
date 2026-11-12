
import fs from 'node:fs';
import crypto from 'node:crypto';
const cssFile='photobridge-r1804-album-order-layout.css';
const read=p=>fs.readFileSync(p,'utf8');
const web='dist/web', native='dist/web/lab-desktop-ui';
const sourceCss=read(web+'/'+cssFile);
if(!sourceCss.includes('grid-column:1/-1!important') || !sourceCss.includes('direction:rtl!important'))throw Error('[R1804] album CSS missing required layout');
for(const root of [web,native]){
  if(!fs.existsSync(root+'/photobridge-r1802-album-compact.css'))throw Error('[R1804] R1802 stylesheet missing: '+root);
  const htmlFile=root+'/index.html',html=read(htmlFile);
  const marker='</head>';
  if(html.includes(cssFile)||html.split(marker).length!==2)throw Error('[R1804] expected one HTML insertion point: '+root);
  const link='<link rel="stylesheet" href="/'+cssFile+'?v=r1804" />';
  fs.writeFileSync(htmlFile,html.replace(marker,link+marker));
}
fs.copyFileSync(web+'/'+cssFile,native+'/'+cssFile);
const mf=native+'/manifest.json',manifest=JSON.parse(read(mf));
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex');
for(const name of ['index.html',cssFile]){
  const entry=manifest.files.find(f=>f.name===name);
  if(entry)entry.sha256=hash(name);
  else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:hash(name)});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(mf,JSON.stringify(manifest));
console.log('[R1804] album RTL layout and full-width file chooser installed for web and Windows UI');
