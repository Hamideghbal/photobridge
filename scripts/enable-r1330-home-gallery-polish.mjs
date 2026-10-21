import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
// Install a homepage-only prepaint guard before any deferred application scripts.
const guard = `<script id="pb1330HomePrepaint">if(location.pathname==='/'){document.documentElement.classList.add('pb1330HomePending');setTimeout(()=>document.documentElement.classList.remove('pb1330HomePending'),6000)}</script><style id="pb1330HomePrepaintStyle">html.pb1330HomePending #root,html.pb1330HomePending :is(#pbCanonicalHeaderV584,#pbCanonicalHeaderV623,.pbHomeMobileAccountBar){visibility:hidden!important}</style>`;
function walk(dir){
 if(!fs.existsSync(dir))return;
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()){walk(file);continue;}
  if(!entry.name.endsWith('.html'))continue;
  let html=fs.readFileSync(file,'utf8');
  if(!html.includes('photobridge-public-nav-v625.js'))continue;
  if(!html.includes('id="pb1330HomePrepaint"'))html=html.replace('<head>','<head>\n'+guard);
  html=html.replace(/(photobridge-public-nav-v625\.js)([^"'<>\s]*)/g,(_,name,q)=>name+q.replace(/[?&]home=[^&]*/g,'')+(q.includes('?')?'&':'?')+'home=r1330');
  html=html.replace(/(photobridge-r1310-layout\.css)([^"'<>\s]*)/g,(_,name,q)=>name+q.replace(/[?&]intro=[^&]*/g,'')+(q.includes('?')?'&':'?')+'intro=r1330');
  fs.writeFileSync(file,html);
  const prefix=html.match(/src=["']([^"']*)photobridge-public-nav-v625\.js/)?.[1];
  if(prefix==='./'||prefix==='')for(const asset of ['photobridge-public-nav-v625.js','photobridge-r1310-layout.css']){
   const dest=path.join(dir,asset);if(path.resolve(dest)!==path.resolve('dist/web/'+asset))fs.copyFileSync('dist/web/'+asset,dest);
  }
 }
}
walk('dist/web');walk('dist/api');
// The copied offline UI must retain valid hashes after changing its shared assets.
for(const channel of ['desktop-ui','lab-desktop-ui']){
 const root=path.resolve('dist/web',channel),file=path.join(root,'manifest.json');
 if(!fs.existsSync(file))continue;
 const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
 if(manifest.protocol!==1||!Array.isArray(manifest.files))throw Error('Invalid desktop manifest');
 for(const entry of manifest.files){
  const asset=path.resolve(root,entry.name);
  if(!asset.startsWith(root+path.sep)||!fs.statSync(asset).isFile())throw Error('Invalid desktop asset');
  entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex');
 }
 manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
 fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
}
console.log('[R1330] Styled install action, polished home first paint and centered gallery intro.');
