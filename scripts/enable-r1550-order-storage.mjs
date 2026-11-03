import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const native='dist/web/lab-desktop-ui',asset='assets/index-UIRefine-v655-r84.js',marker='/* PB1550 per-order storage capabilities */';
for(const root of ['dist/web',native]){
 const file=root+'/'+asset;let source=fs.readFileSync(file,'utf8');
 if(!source.includes(marker)){
  const once=(from,to)=>{if(source.split(from).length!==2)throw Error('R1550 changed anchor: '+from.slice(0,120));source=source.replace(from,to)};
  const start=source.indexOf('async function el(t,a){'),end=source.indexOf('/* PB1138 canonical lab storage bridge */',start);
  if(start<0||end<start)throw Error('R1550 local target missing');
  source=source.slice(0,start)+'async function el(t,a){return pb1550Target(await pb1550Root(t,false),t,a)}'+source.slice(end);
  once('const key = Uy(detail,file);','const key = String(file.id);');
  once('root = await pb1450Root(true);','root = await pb1450Root(true,detail);');
  once('root = await pb1450Root(false);','root = await pb1450Root(false,detail);');
  once('const root=await pb1450Root(false),targets=new Map(),receipts={};','const root=await pb1450Root(false,prepared),targets=new Map(),receipts={};');
  const old='let s=await qs();if(s||(s=await no()),!await Vs(s))throw new Error("folder_permission_denied");';
  // Only the local preview entry still has this prefix after el is replaced.
  once(old,'let s=await pb1550Root(t,false);if(!await Vs(s))throw new Error("folder_permission_denied");');
  for(const name of ['pb1451ReadArchive','pb1451OpenArchiveFile']){
   const a=source.indexOf('async function '+name+'('),b=source.indexOf('\nasync function ',a+20);
   if(a<0)throw Error('R1550 archive entry missing');
   const end=b<0?source.length:b,part=source.slice(a,end),from='const root=await qs();';
   if(part.split(from).length!==2)throw Error('R1550 archive root changed: '+name);
   source=source.slice(0,a)+part.replace(from,'const root=await pb1550Root(detail,false);')+source.slice(end);
  }
  source+='\n'+marker+'\n'+fs.readFileSync('scripts/r1550-order-storage.js.txt','utf8')+'\n';fs.writeFileSync(file,source);
 }
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const htmlFile=root+'/index.html';let html=fs.readFileSync(htmlFile,'utf8');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&orderStorage=r1550')?url:url+'&orderStorage=r1550');fs.writeFileSync(htmlFile,html);
}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),file=native+'/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
for(const name of [asset,'index.html']){const row=manifest.files.find(x=>x.name===name);if(!row)throw Error('R1550 manifest entry missing');row.sha256=hash(fs.readFileSync(native+'/'+name));}
manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(manifest));
console.log('[R1550] Browser and Windows orders retain their own disk locations',manifest.build.slice(0,12));
