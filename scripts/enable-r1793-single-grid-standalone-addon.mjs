/* R1793: true one-grid tariffs + standalone no-paper product orders. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{let n=s.split(a).length-1;if(n!==1)throw Error('[R1793] '+label+' anchor '+n);return s.replace(a,b)};
const section=(s,start,end,patch,label)=>{let a=s.indexOf(start),b=s.indexOf(end,a+start.length);if(a<0||b<=a)throw Error('[R1793] '+label+' region');return s.slice(0,a)+patch(s.slice(a,b))+s.slice(b)};
const bundle='assets/index-UIRefine-v655-r84.js';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+bundle;
 let ui=read(file);
 ui=section(ui,'function Qj(','function Zj(',part=>one(part,
  'className:"priceScroller walkinPriceScroller",children:',
  'className:"priceScroller walkinPriceScroller",style:{"--pb1793-columns":pb1777Fields.length},children:',
  root+' one shared header/body tariff track'),'walk-in tariff '+root);
 if(root==='dist/web'){
  ui=section(ui,'function ej(','function vh(',part=>{
   const key='className:"simplePrintPhotoGrid",children:[ue.files.some(';
   const a=part.indexOf(key),b=a<0?-1:part.indexOf('ue.files.map(Be=>{',a);
   if(a<0||b<=a||b-a>1300)throw Error('[R1793] R1792 group checkbox not found');
   part=part.slice(0,a)+'className:"simplePrintPhotoGrid",children:['+part.slice(b);
   part=one(part,'[pb1781Picker,pb1781SetPicker]=x.useState(null);',
    '[pb1781Picker,pb1781SetPicker]=x.useState(null),[pb1793Standalone,pb1793SetStandalone]=x.useState(false);',
    'standalone composer state');
   part=one(part,'const ot=T.reduce(',read('scripts/r1793-addon-ticket-builder.js.txt')+'const ot=T.reduce(','job ticket to draft');
   part=one(part,'e.jsx("button",{type:"button",className:"primary simplePrintPilotHeaderSubmit',
    'e.jsx("button",{type:"button",className:"pb1793StandaloneLaunch",disabled:W||c,onClick:()=>pb1793SetStandalone(true),children:"سفارش شاسی و قاب بدون چاپ"}),e.jsx("button",{type:"button",className:"primary simplePrintPilotHeaderSubmit',
    'button next to size and file button');
   part=one(part,'children:[pb1781Picker&&(()=>{',
    'children:[pb1793Standalone&&e.jsx(PB1793AddonOnlyDialog,{prices:t?.prices||[],catalog:pb1781Catalog,onClose:()=>pb1793SetStandalone(false),onAdd:pb1793Add}),pb1781Picker&&(()=>{',
    'standalone modal render');
   part=one(part,'pbG.files.filter(pbF=>!Ku(',
    'pbG.files.filter(pbF=>!pbF.isAddonOnly&&!Ku(',
    'exclude product-only ticket from photo ratio check');
   part=one(part,'e.jsx(wn,{value:Be.paperOverride||ue.paperType,options:b.map(tt=>({value:tt,label:Da[tt]||tt})),onChange:tt=>Ie(ue.id,Be.id,tt===ue.paperType?"":tt)})',
    'Be.isAddonOnly?e.jsx("span",{className:"pb1793NoPaper",children:"بدون چاپ عکس"}):e.jsx(wn,{value:Be.paperOverride||ue.paperType,options:b.map(tt=>({value:tt,label:Da[tt]||tt})),onChange:tt=>Ie(ue.id,Be.id,tt===ue.paperType?"":tt)})',
    'ticket paper selector');
   part=one(part,'(ee||Q)&&e.jsxs("div",{className:"simplePrintPhotoAddonOverrides"',
    '(ee||Q)&&!Be.isAddonOnly&&e.jsxs("div",{className:"simplePrintPhotoAddonOverrides"',
    'no model checkboxes for independent product');
   part=one(part,'className:"simplePrintPhotoCard "+(Number(Be.progress',
    'className:"simplePrintPhotoCard "+(Be.isAddonOnly?"pb1793ProductCard ":"")+(Number(Be.progress',
    'standalone product distinct card marker');
   part=one(part,'className:"simplePrintPhotoInfo",children:[e.jsx("b"',
    'className:"simplePrintPhotoInfo",children:[Be.isAddonOnly&&e.jsx("b",{className:"pb1793TicketName",children:["بدون چاپ عکس · ",Be.chassisModelName||"",Be.frameModelName?" · "+Be.frameModelName:"",Be.frameColorName?" · "+Be.frameColorName:""]}),e.jsx("b"',
    'human-readable standalone product title');
   part=one(part,'className:"simplePrintPhotoCopies",children:[e.jsx("span",{children:"تعداد چاپ"})',
    'className:"simplePrintPhotoCopies",children:[e.jsx("span",{children:Be.isAddonOnly?"تعداد محصول":"تعداد چاپ"})',
    'standalone product quantity label');
   part=one(part,'disabled:W,onClick:()=>pe(ue.id,Be.id),children:"جایگزین"',
    'disabled:W||Be.isAddonOnly,onClick:()=>pe(ue.id,Be.id),children:Be.isAddonOnly?"بدون عکس":"جایگزین"',
    'do not replace work order ticket with user photo');
   return part;
  },'photographer uploader');
  ui+='\n'+read('scripts/r1793-standalone-addon-dialog.js.txt')+'\n';
 }
 write(file,ui);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
let server=read('dist/api/server.js');
server=one(server,'return sendJson(res,200,{catalog:{types:catalog.types,rates:catalog.rates}});',
 'return sendJson(res,200,{catalog:{types:catalog.types,rates:catalog.rates,stocks:catalog.stocks}});',
 'safe model stock sent only to assigned photographer');
write('dist/api/server.js',server);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
const style='photobridge-r1793-single-grid-standalone-addon.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const f=root+'/index.html';let html=read(f);
 if(!html.includes(style))html=one(html,'</head>','<link rel="stylesheet" href="/'+style+'?v=r1793"></head>',root+' stylesheet');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&singleGrid=r1793')?url:url+'&singleGrid=r1793');
 write(f,html);
}
fs.copyFileSync('dist/web/'+style,'dist/web/lab-desktop-ui/'+style);
const root='dist/web/lab-desktop-ui',mp=root+'/manifest.json',manifest=JSON.parse(read(mp));
if(manifest.channel!=='lab'||manifest.protocol!==1)throw Error('[R1793] bad Windows manifest');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const path of [bundle,style,'index.html']){
 const digest=sha(root+'/'+path),item=manifest.files.find(f=>f.name===path);
 if(item)item.sha256=digest;
 else manifest.files.push({name:path,url:'/lab-desktop-ui/'+path,sha256:digest});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();write(mp,JSON.stringify(manifest));
console.log('[R1793] single customer tariff grid and separate size/frame/chassis non-print order complete');
