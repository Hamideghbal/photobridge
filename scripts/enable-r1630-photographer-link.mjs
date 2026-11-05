import fs from 'node:fs';import crypto from 'node:crypto';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1630 invitation anchor '+a.slice(0,90));return s.replace(a,b)};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8'),a=s.indexOf('function Xl('),b=s.indexOf('function ',a+15),part=s.slice(a,b);
 part=once(part,'const pbR1624TempName=x.useRef("");','const pbR1624TempName=x.useRef("");const[pb1630Ready,pb1630SetReady]=x.useState(false);');
 part=once(part,'I(A.commissionSettings||null),g("")','I(A.commissionSettings||null),g(""),pb1630SetReady(true)');
 part=once(part,'je=a.find(A=>A.active&&!A.targetMobile)||a.find(A=>!A.targetMobile)||null','je=a.find(A=>A.active&&!A.targetMobile)||null');
 part=once(part,'e.jsx(PB1436LabInvites,{invite:je','e.jsx(PB1436LabInvites,{ready:pb1630Ready,invite:je');s=s.slice(0,a)+part+s.slice(b);
 a=s.indexOf('function PB1436LabInvites(');b=s.indexOf('\nfunction ',a+15);if(a<0||b<a)throw Error('R1630 child boundaries');part=s.slice(a,b);
 part=once(part,'({invite,url,copy,create,creating,','({ready,invite,url,copy,create,creating,');
 part=once(part,"[temporaryName,setTemporaryName]=x.useState('');return", "[temporaryName,setTemporaryName]=x.useState('');const autoLink=x.useRef(false);x.useEffect(()=>{if(ready&&!invite&&!creating&&!autoLink.current){autoLink.current=true;void create()}},[ready,invite,creating]);return");
 part=once(part,"placeholder:'لینک دعوت‌نامه پس از اولین ارسال ساخته می‌شود'", "placeholder:error?'دریافت لینک انجام نشد؛ تلاش دوباره را بزنید':'در حال آماده‌سازی لینک دعوت‌نامه…'");
 part=once(part,"invite?e.jsx('button',{type:'button',onClick:()=>copy(invite),children:'کپی'}):e.jsx('button',{type:'button',disabled:creating,onClick:create,children:creating?'در حال ساخت…':'ساخت لینک'})", "e.jsx('button',{type:'button',className:'pb1630CopyButton',disabled:creating||(!ready&&!error),onClick:()=>invite?copy(invite):create(),children:invite?'کپی':creating?'در حال آماده‌سازی…':error?'تلاش دوباره':'آماده‌سازی لینک'})");
 part=once(part,"placeholder:'نام عکاس / نام عکاسی (موقت)'", "placeholder:'نام عکاس / عکاسی',title:'نام موقت عکاس یا عکاسی'");
 part=once(part,"'بدهی قبلی (تومان، اختیاری)'", "'بدهی اولیه (تومان)'");s=s.slice(0,a)+part+s.slice(b);fs.writeFileSync(file,s);
 const css='photobridge-r1630-photographer-link.css';fs.copyFileSync('scripts/r1630-photographer-link.css',root+'/'+css);const html=root+'/index.html';s=fs.readFileSync(html,'utf8').replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1630"></head>`).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,'$1&photographerLink=r1630');fs.writeFileSync(html,s);
}
const root='dist/web/lab-desktop-ui',path=root+'/manifest.json',m=JSON.parse(fs.readFileSync(path)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1630-photographer-link.css']){let row=m.files.find(x=>x.name===name);if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row)}row.sha256=hash(fs.readFileSync(root+'/'+name))}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(m));
