/* R1792: aligned walk-in tariff columns and group-level addon-only purchase controls. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1792] '+label+' anchor '+n);return s.replace(a,b)};
const name='photobridge-r1792-tariff-photo-options.css';
const roots=['dist/web','dist/web/lab-desktop-ui'];
const bundle='assets/index-UIRefine-v655-r84.js';
// Only the browser photographer uploads photos; the Lab native UI has a different role.
const asset='dist/web/'+bundle;
let ui=read(asset);
const start=ui.indexOf('function ej('),end=ui.indexOf('function vh(',start);
if(start<0||end<=start)throw Error('[R1792] photographer upload scope missing');
let part=ui.slice(start,end);
const photoToggle='e.jsxs("label",{className:"pb1781WithoutPrint",children:[e.jsx("input",{type:"checkbox",disabled:W||!(bt||Nt),checked:!!(Be.withoutPrint&&(bt||Nt)),onChange:ev=>pb1781FileSet(ue.id,Be.id,"withoutPrint",ev.target.checked)}),"فقط قاب / شاسی، بدون چاپ عکس"]}),';
part=one(part,photoToggle,'','remove independent purchase checkbox from every photo');
const photoGrid='className:"simplePrintPhotoGrid",children:[ue.files.map(Be=>{';
const groupToolbar='className:"simplePrintPhotoGrid",children:['+
 'ue.files.some(file=>Wr(ue,file,"chassis")||Wr(ue,file,"frame"))&&e.jsxs("label",{className:"pb1792AddonOnlyGroup",children:['+
 'e.jsx("input",{type:"checkbox",disabled:W,checked:ue.files.filter(file=>Wr(ue,file,"chassis")||Wr(ue,file,"frame")).every(file=>!!file.withoutPrint),onChange:ev=>k(groups=>groups.map(group=>group.id!==ue.id?group:{...group,files:group.files.map(file=>(Wr(group,file,"chassis")||Wr(group,file,"frame"))?{...file,withoutPrint:ev.target.checked}:file)}))}),'+
 'e.jsxs("span",{children:[e.jsx("strong",{children:"فقط ساخت شاسی یا قاب"}),e.jsx("small",{children:"این سفارش فقط شامل شاسی یا قاب است؛ عکس کاغذی چاپ نشود."})]})]}),'+
 'ue.files.map(Be=>{';
part=one(part,photoGrid,groupToolbar,'group-level no-paper purchase control');
if(!part.includes('withoutPrint:!!(tt.withoutPrint&&(yt||Tt))'))throw Error('[R1792] selected photo invoice workflow unavailable');
ui=ui.slice(0,start)+part+ui.slice(end);
write(asset,ui);
execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
for(const root of roots){
 const path=root+'/index.html';
 let html=read(path);
 if(!html.includes(name))html=one(html,'</head>','<link rel="stylesheet" href="/'+name+'?v=r1792"></head>',root+' stylesheet');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&tariffCards=r1792')?url:url+'&tariffCards=r1792');
 write(path,html);
}
fs.copyFileSync('dist/web/'+name,'dist/web/lab-desktop-ui/'+name);
const native='dist/web/lab-desktop-ui',manifestFile=native+'/manifest.json';
const manifest=JSON.parse(read(manifestFile));
if(manifest.channel!=='lab'||manifest.protocol!==1)throw Error('[R1792] invalid native manifest');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const filename of [name,'index.html']){
 const entry=manifest.files.find(x=>x.name===filename),digest=hash(native+'/'+filename);
 if(entry)entry.sha256=digest;
 else manifest.files.push({name:filename,url:'/lab-desktop-ui/'+filename,sha256:digest});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(manifest));
console.log('[R1792] customer tariff columns aligned; photo model tags responsive; no-paper toggle moved above cards');
