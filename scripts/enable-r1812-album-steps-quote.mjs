
/* R1812: prevent numbered album step overlap and show one inclusive combined tariff per paper.
   The committed R1805 backend already freezes printTotal=0 in combined mode and puts the
   full inclusive price into bindingTotal. Do not add a second binding charge in the quote. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('[R1812] '+label+' expected once, got '+count);
 return s.replace(a,b);
};
const region=(s,start,end,change,label)=>{
 const i=s.indexOf(start),j=i<0?-1:s.indexOf(end,i+start.length);
 if(i<0||j<=i)throw Error('[R1812] missing '+label+' bounds');
 return s.slice(0,i)+change(s.slice(i,j))+s.slice(j);
};
const asset='assets/index-UIRefine-v655-r84.js';
const style='photobridge-r1812-album-steps-quote.css';
const helper=read('scripts/r1812-album-quote-helper.js.txt');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const f=root+'/'+asset;
 let ui=read(f);
 ui=region(ui,'function Kv(','function ',s=>{
  // Both the quantity and the inclusive paper tariff already live in _a,
  // while ma is the ordinary print subtotal and MUST be zero in combined mode.
  if(!s.includes('ma=Tt||pb1795Combined?0:yt.reduce('))throw Error('[R1812] missing combined print-total guard');
  if(!s.includes('_a=pb1795Combined?yt.reduce('))throw Error('[R1812] missing bundled paper sum');
  s=one(s,
   'children:[!pb1795Combined&&yt.map($e=>',
   'children:[pb1795Combined&&yt.map($e=>{const pb1812Line=pb1812BundledPaperLine(pb1539Catalog,String((Be==null?void 0:Be.printSizeId)||""),String(pb1539Chosen.id),$e.value,$e.count);return e.jsxs("div",{className:pb1812Line.known?"":"albumQuotePaperPending",children:[e.jsxs("span",{children:["چاپ و صحافی ",$e.label," · ",V($e.count)," صفحه"]}),e.jsx("b",{children:pb1812Line.known?V(pb1812Line.total):"قیمت‌گذاری لابراتوار"})]},$e.value)}),!pb1795Combined&&yt.map($e=>',
   'display one bundled rate for each selected paper');
  const extra='e.jsxs("div",{children:[e.jsxs("span",{children:["صحافی ",(Be==null?void 0:Be.label)||""," · ",V(Qn)," صفحه"]}),e.jsx("b",{children:Q?"قیمت‌گذاری لابراتوار":V(_a)})]})';
  s=one(s,extra,'!pb1795Combined&&'+extra,'hide standalone binding charge in combined quote');
  return s;
 },root+' photographer album');
 ui+='\n'+helper;
 write(f,ui);
 execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
 const htmlPath=root+'/index.html';
 let html=read(htmlPath);
 html=one(html,'</head>','<link rel="stylesheet" href="/'+style+'?v=r1812"></head>',root+' CSS');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,match=>match+'&albumQuote=r1812');
 write(htmlPath,html);
}
fs.copyFileSync('dist/web/'+style,'dist/web/lab-desktop-ui/'+style);
const native='dist/web/lab-desktop-ui';
const mf=native+'/manifest.json',manifest=JSON.parse(read(mf));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of [asset,style,'index.html']){
 const sha256=hash(fs.readFileSync(native+'/'+name));
 const item=manifest.files.find(x=>x.name===name);
 if(item)item.sha256=sha256;
 else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(mf,JSON.stringify(manifest));
console.log('[R1812] separated album steps, inclusive per-paper quote, no second binding row; web/native updated');
