import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const uiPath='dist/web/assets/index-UIRefine-v655-r84.js';
const htmlPath='dist/web/index.html';
const helperPath='dist/web/photobridge-r1592-order-fly.js';
const stylePath='dist/web/photobridge-r1592-order-fly.css';
let ui=fs.readFileSync(uiPath,'utf8');
const start=ui.indexOf('function Zg(');
const end=ui.indexOf('function wv(',start);
if(start<0||end<=start)throw new Error('R1592 photographer order workspace function anchors missing');
let chunk=ui.slice(start,end);

function replaceOnce(from,to,label){
  if(chunk.split(from).length!==2)throw new Error('R1592 missing or repeated '+label);
  chunk=chunk.replace(from,to);
}
if(!chunk.includes('PB1592Active=x.useRef(a)')){
  replaceOnce('v=x.useRef(0),$=','v=x.useRef(0),PB1592Active=x.useRef(a),$=','active tab ref');
  // Previously every ready event changed the selected tab and scrolled into it.
  replaceOnce(';s("ready"),E(',';E(','ready auto-switch');
  replaceOnce('};x.useEffect(()=>{v.current+=1,J.current=[]',
              '};PB1592Active.current=a;x.useEffect(()=>{v.current+=1,J.current=[]',
              'latest active filter (prevent interval closures capturing stale tab)');
  const old='const we=new Map(J.current.map(H=>[String(H.id),String(H.status||"")]));for(const H of Ee){';
  const inserted=[
    'const we=new Map(J.current.map(H=>[String(H.id),String(H.status||"")]));',
    'const PB1592Bucket=status=>status==="ready"?"ready":status==="completed"?"completed":status==="needs_fix"?"needs_fix":"flow";',
    'for(const H of Ee){',
    ' const oldStatus=we.get(String(H.id)),newStatus=String(H.status||"");',
    ' if(oldStatus && oldStatus!==newStatus && PB1592Active.current===PB1592Bucket(oldStatus)',
    ' && PB1592Bucket(oldStatus)!==PB1592Bucket(newStatus)',
    ' && (PB1592Bucket(newStatus)==="ready"||PB1592Bucket(newStatus)==="completed")){',
    '   window.PB1592FlyOrder?.({orderId:String(H.id),mode:l,target:PB1592Bucket(newStatus)});',
    ' }',
    '}',
    'for(const H of Ee){'
  ].join('\n');
  replaceOnce(old,inserted,'status change comparison before render');
  replaceOnce('children:"سفارش به تب «آماده تحویل» منتقل شد و همین‌جا برایت باز شده است."',
              'children:"سفارش به تب «آماده تحویل» منتقل شد. تب فعلی بدون تغییر باقی می‌ماند."',
              'ready notification guidance');
  ui=ui.slice(0,start)+chunk+ui.slice(end)+'\n/* PB1592 photographer order flight on actual status transition */\n';
  fs.writeFileSync(uiPath,ui);
  execFileSync(process.execPath,['--check',uiPath],{stdio:'inherit'});
  console.log('[R1592] ready notification no longer changes selected tab; fly on real flow→ready and ready→completed.');
}

fs.writeFileSync(helperPath,fs.readFileSync('scripts/r1592-photographer-order-fly.js','utf8'));
fs.writeFileSync(stylePath,fs.readFileSync('scripts/r1592-photographer-order-fly.css','utf8'));
execFileSync(process.execPath,['--check',helperPath],{stdio:'inherit'});
let html=fs.readFileSync(htmlPath,'utf8');
const css='/photobridge-r1592-order-fly.css?v=r1592';
const js='/photobridge-r1592-order-fly.js?v=r1592';
if(!html.includes(css)||!html.includes(js)){
 if(!html.includes('</head>'))throw new Error('R1592 missing document head');
 const resources='<link rel="stylesheet" href="'+css+'">\n<script defer src="'+js+'"></script>';
 html=html.replace('</head>',resources+'\n</head>');
 fs.writeFileSync(htmlPath,html);
}
console.log('[R1592] Desktop photographer order-card flight visual assets installed.');
