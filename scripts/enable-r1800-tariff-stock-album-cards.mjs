import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('[R1800] anchor '+a.slice(0,80));return s.replace(a,b)};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let s=read(file);
 let a=s.indexOf('function tw('),b=s.indexOf('function Na(t)',a),p=s.slice(a,b);if(a<0||b<a)throw Error('tariff bounds');
 p=one(p,'const h=[[','const h=pb1800TariffFields([[');
 p=one(p,'],S=async()=>','],pb1539Types),S=async()=>');
 p=one(p,'e.jsxs("b",{children:[e.jsx("span",{className:"pb1541TariffTitle",title:E,children:E})','e.jsxs("b",{"data-pb1800-key":k,children:[e.jsx("span",{className:"pb1541TariffTitle",title:E,children:e.jsx(PB1800TariffTitle,{fieldKey:k,label:E})})');
 p=one(p,'className:"mobilePriceCell",children:[e.jsx("small",{children:w})','className:"mobilePriceCell","data-pb1800-key":C,children:[e.jsx("small",{children:e.jsx(PB1800TariffTitle,{fieldKey:C,label:w})})');
 s=s.slice(0,a)+p+s.slice(b);
 a=s.indexOf('function Qj(');b=s.indexOf('function Zj(',a);p=s.slice(a,b);
 p=one(p,'pb1777Fields=PB1437TariffFields().flatMap(', 'pb1777Fields=pb1800TariffFields(PB1437TariffFields().flatMap(');
 p=one(p,']),pb1777Value=',']),pb1777Catalog.types||[]),pb1777Value=');
 s=s.slice(0,a)+p+s.slice(b);
 a=s.indexOf('function PB1797WalkinTable(');b=s.indexOf('\n}',a);p=s.slice(a,b);
 p=one(p,"return e.jsxs('th',{scope:'col',children:[e.jsx('span',{className:'pb1541TariffTitle',children:label})","return e.jsxs('th',{scope:'col','data-pb1800-key':key,children:[e.jsx('span',{className:'pb1541TariffTitle',children:e.jsx(PB1800TariffTitle,{fieldKey:key,label})})");
 p=one(p,"e.jsx('td',{children:e.jsx('input'","e.jsx('td',{'data-pb1800-key':key,children:e.jsx('input'");
 p=p.replaceAll("key.startsWith('pb1789_stock_')?","pb1800IsStock(key)?");
 s=s.slice(0,a)+p+s.slice(b)+'\n'+read('scripts/r1800-tariff-fields.js.txt');fs.writeFileSync(file,s);execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const html=root+'/index.html';fs.writeFileSync(html,one(read(html),'</head>','<link rel="stylesheet" href="/photobridge-r1800-tariff-album.css?v=r1800"></head>').replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&stockPairs=r1800'));
}
const root='dist/web/lab-desktop-ui',style='photobridge-r1800-tariff-album.css';fs.copyFileSync('dist/web/'+style,root+'/'+style);
const file=root+'/manifest.json',m=JSON.parse(read(file)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',style]){const sha256=hash(fs.readFileSync(root+'/'+name)),old=m.files.find(f=>f.name===name);if(old)old.sha256=sha256;else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256})}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(m));
