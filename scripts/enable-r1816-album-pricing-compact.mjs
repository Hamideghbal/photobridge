
/* R1816: replace only the album-binding modal helper after earlier regression
   tests. Preserve the tested API, tariffs, checkout and paper calculation. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('[R1816] '+label+' expected 1 occurrence, got '+n);
 return s.replace(a,b);
};
const asset='assets/index-UIRefine-v655-r84.js';
const css='photobridge-r1816-album-pricing-compact.css';
const previous=read('scripts/r1811-album-binding-modal.js.txt');
const updated=read('scripts/r1816-album-binding-modal.js.txt');
if(previous===updated||!updated.includes('function pb1816GroupedMoney(')
 ||!updated.includes('className:"pb1816FooterModels"')
 ||!updated.includes('className:"pb1816HeaderMode"'))
 throw Error('[R1816] malformed replacement modal');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const f=root+'/'+asset;
 let ui=read(f);
 ui=once(ui,previous,updated,root+' binding modal');
 write(f,ui);
 execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
 const path=root+'/index.html';
 let html=read(path);
 html=once(html,'</head>','<link rel="stylesheet" href="/'+css+'?v=r1816"></head>',root+' compact modal style');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&albumModal=r1816');
 write(path,html);
}
fs.copyFileSync('dist/web/'+css,'dist/web/lab-desktop-ui/'+css);
const native='dist/web/lab-desktop-ui';
const manifestFile=native+'/manifest.json',m=JSON.parse(read(manifestFile));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of [asset,css,'index.html']){
 const sha256=hash(fs.readFileSync(native+'/'+name));
 const entry=m.files.find(x=>x.name===name);
 if(entry)entry.sha256=sha256;
 else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
m.build=hash(JSON.stringify(m.files));
m.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(m));
console.log('[R1816] grouped prices, model archive ×, compact mode header and footer model selector installed on web + Windows');
