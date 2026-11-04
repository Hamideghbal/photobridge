import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const path='dist/web/assets/index-UIRefine-v655-r84.js';
const htmlPath='dist/web/index.html';
const cssDest='dist/web/photobridge-r1593-photographer-compact.css';
const labCssDest='dist/web/photobridge-r1593-lab-order-fly.css';
const labJsDest='dist/web/photobridge-r1593-lab-order-fly.js';

let js=fs.readFileSync(path,'utf8');
if(!js.includes('/* PB1593 lab queue flight */')){
 const start=js.indexOf('function Uf('),end=js.indexOf('function vi(',start);
 if(start<0||end<=start)throw new Error('R1593 lab workflow boundaries missing');
 let chunk=js.slice(start,end);
 function replaceOne(hay,needle,replacement,name){
   const count=hay.split(needle).length-1;
   if(count!==1)throw new Error('R1593 expected one '+name+' anchor, found '+count);
   return hay.replace(needle,replacement);
 }

 chunk=replaceOne(chunk,
   'await ee(T,nt,()=>{k(nt),S(null),I(null),O(null),Dn(ur(nt,"",l))}),b(String(le.id))',
   'S(null),I(null),O(null),b(String(le.id))',
   'no automatic lab tab switch');

 // PATCH confirmations: start a flight ONLY AFTER the API reports success and
 // BEFORE ye() replaces the old card from server data.
 const it=chunk.indexOf('It=async('),gn=chunk.indexOf(',gn=async le=>',it);
 if(it<0||gn<=it)throw new Error('R1593 lab It completion boundary missing');
 let itBody=chunk.slice(it,gn);
 itBody=replaceOne(itBody,'return await ye(),Mt',
   'return nt==="completed"&&window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"completed"}),await ye(),Mt',
   'print delivered confirmation before refresh');
 chunk=chunk.slice(0,it)+itBody+chunk.slice(gn);

 // Both print-ready variants: no-invoice orders and invoiced orders.
 const un=chunk.indexOf('un=async le=>'),cn=chunk.indexOf(',Cn=async(le,nt)=>',un);
 if(un<0||cn<=un)throw new Error('R1593 print-ready handler boundary missing');
 let ready=chunk.slice(un,cn);
 const readyAnchor='await ye(),await Gt(le,"ready"),qt=!0';
 const readyCount=ready.split(readyAnchor).length-1;
 if(readyCount!==2)throw new Error('R1593 expected two print-ready completion points, found '+readyCount);
 ready=ready.split(readyAnchor).join(
   'window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"ready"}),await ye(),await Gt(le,"ready"),qt=!0');
 chunk=chunk.slice(0,un)+ready+chunk.slice(cn);

 const album=chunk.indexOf('Cn=async(le,nt)=>'),actions=chunk.indexOf(',aa=async(le,nt)=>',album);
 if(album<0||actions<=album)throw new Error('R1593 album stage boundary missing');
 let albumBody=chunk.slice(album,actions);
 albumBody=replaceOne(albumBody,
   'nt==="ready"&&(await ye(),await Gt(le,"ready"),qt=!0)',
   'nt==="ready"&&(window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"ready"}),await ye(),await Gt(le,"ready"),qt=!0)',
   'album ready before refresh');
 albumBody=replaceOne(albumBody,
   'nt!=="ready"&&(await ye(),nt==="completed"?',
   'nt!=="ready"&&(nt==="completed"&&window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"completed"}),await ye(),nt==="completed"?',
   'album delivered before refresh');
 chunk=chunk.slice(0,album)+albumBody+chunk.slice(actions);

 // Toast describes the movement, not a user-selected tab change.
 chunk=replaceOne(chunk,'children:"تب سفارش تغییر کرد"',
   'children:"سفارش به بخش جدید منتقل شد"','accurate lab toast');

 js=js.slice(0,start)+chunk+js.slice(end)+'\n/* PB1593 lab queue flight */\n';
 fs.writeFileSync(path,js);
 execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 console.log('[R1593] Lab ready/completed card transition now keeps its selected tab and route.');
}
fs.writeFileSync(cssDest,fs.readFileSync('scripts/r1593-photographer-card-compact.css','utf8'));
fs.writeFileSync(labCssDest,fs.readFileSync('scripts/r1593-lab-order-fly.css','utf8'));
fs.writeFileSync(labJsDest,fs.readFileSync('scripts/r1593-lab-order-fly.js','utf8'));
execFileSync(process.execPath,['--check',labJsDest],{stdio:'inherit'});

let html=fs.readFileSync(htmlPath,'utf8');
const resources=[
 '<link rel="stylesheet" href="/photobridge-r1593-photographer-compact.css?v=r1593">',
 '<link rel="stylesheet" href="/photobridge-r1593-lab-order-fly.css?v=r1593">',
 '<script defer src="/photobridge-r1593-lab-order-fly.js?v=r1593"></script>'
];
if(!resources.every(v=>html.includes(v))){
 if(!html.includes('</head>'))throw new Error('R1593 HTML head missing');
 html=html.replace('</head>',resources.filter(v=>!html.includes(v)).join('\n')+'\n</head>');
 fs.writeFileSync(htmlPath,html);
}
console.log('[R1593] Desktop photographer and native Lab web UI styling registered once.');
