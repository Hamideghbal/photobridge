import fs from 'node:fs';
const root='dist/web/',asset=root+'assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(asset,'utf8');
if(!ui.includes('/* PB1488 phone stable range refresh */')){
 const once=(old,next)=>{if(ui.split(old).length!==2)throw Error('R1488 missing or ambiguous anchor: '+old.slice(0,80));ui=ui.replace(old,next)};
 const component='function ub({role:t,quickPinned:a=[],onToggleQuick:s}){var _t,yt,Tt,Wt,Gt,on,Nn,ea,Tn;';
 const hooks=`/* PB1488 phone stable range refresh */
const [pb1488Busy,pb1488SetBusy]=x.useState(false),[pb1488Version,pb1488SetVersion]=x.useState(0),pb1488InFlight=x.useRef(false),pb1488Alive=x.useRef(true),pb1488Scroll=x.useRef(null);
x.useEffect(()=>{pb1488Alive.current=true;return()=>{pb1488Alive.current=false}},[]);
x.useLayoutEffect(()=>{const saved=pb1488Scroll.current;pb1488Scroll.current=null;if(saved?.node?.isConnected)saved.node.scrollTop=saved.top},[pb1488Version]);`;
 once(component,component+hooks);
 const original='bt=async()=>{g(!0);try{const Je=new URLSearchParams;Le&&Je.set("from",$s(Le)),Ke&&Je.set("to",$s(Ke));const Ot=await Me(`/api/lab/finance/summary?${Je.toString()}`);f(Ot.summary||null),C(Ot.customers||[])}finally{g(!1)}}';
 const modified=`bt=async()=>{if(t==="lab"&&pb1487PhonePicker()){
 if(pb1488InFlight.current)return;pb1488InFlight.current=true;pb1488SetBusy(true);
 try{const Je=new URLSearchParams;Le&&Je.set("from",$s(Le)),Ke&&Je.set("to",$s(Ke));const Ot=await Me(\`/api/lab/finance/summary?\${Je.toString()}\`);if(!pb1488Alive.current)return;const node=document.querySelector('.labRoleWorkspace .labRolePageScrollArea');pb1488Scroll.current=node?{node,top:node.scrollTop}:null;f(Ot.summary||null);C(Ot.customers||[]);pb1488SetVersion(value=>value+1)}
 catch(error){if(pb1488Alive.current)void pb1452ArchiveNotice('دریافت اطلاعات بازه انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید.',{title:'دریافت اطلاعات مالی',brandLabel:'فوتوبریج · لابراتوار',tone:'error'})}
 finally{pb1488InFlight.current=false;if(pb1488Alive.current)pb1488SetBusy(false)}return;
 }g(!0);try{const Je=new URLSearchParams;Le&&Je.set("from",$s(Le)),Ke&&Je.set("to",$s(Ke));const Ot=await Me(\`/api/lab/finance/summary?\${Je.toString()}\`);f(Ot.summary||null),C(Ot.customers||[])}finally{g(!1)}}`;
 once(original,modified);
 once('e.jsx("button",{className:"primary",onClick:bt,children:"اعمال بازه"})','e.jsx("button",{className:"primary",onClick:bt,disabled:pb1487PhonePicker()&&pb1488Busy,"aria-busy":pb1487PhonePicker()&&pb1488Busy,children:"اعمال بازه"})');
 fs.writeFileSync(asset,ui);
}
fs.copyFileSync('scripts/r1488-phone-finance.css',root+'photobridge-r1488-phone-finance.css');let html=fs.readFileSync(root+'index.html','utf8');const tag='<link rel="stylesheet" href="/photobridge-r1488-phone-finance.css?v=r1488">';if(!html.includes(tag))html=html.replace('</head>',tag+'\n</head>');fs.writeFileSync(root+'index.html',html);
