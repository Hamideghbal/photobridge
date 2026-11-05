import fs from 'node:fs';import crypto from 'node:crypto';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1629 anchor '+a.slice(0,90));return s.replace(a,b)};
const helper=`
function PB1629WalletLabel({data}){const low=Boolean(data.lab?.sms_customer_notifications_allowed&&data.smsWallet?.serviceEnabled&&Number(data.smsWallet?.price)>0&&Number(data.smsWallet?.remaining??999)<=0);return low?e.jsxs('span',{className:'pb1629WalletNotice',title:'برای ارسال پیامک، کیف پول خدمات را شارژ کنید.',children:[e.jsx('b',{children:'اعتبار پیامک کافی نیست'}),e.jsx('small',{children:'شارژ کیف پول'})]}):e.jsxs(e.Fragment,{children:['اعتبار ',V(data.walletBalance||0)]})}
`;
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
 if(!s.includes('function PB1629WalletLabel')){s=once(s,'title:"اعتبار خدمات",children:["اعتبار ",e.jsx("b",{children:V(l.walletBalance||0)})]','title:"اعتبار خدمات",children:e.jsx(PB1629WalletLabel,{data:l})');
 s=once(s,'title:"کیف پول خدمات",children:["اعتبار ",V(l.walletBalance||0)]','title:"کیف پول خدمات",children:e.jsx(PB1629WalletLabel,{data:l})');
 const banner=s.indexOf('className:`labSmsWalletGlobalAlert '),a=s.lastIndexOf('!!((d=l.lab)',banner),b=s.indexOf(',f==="orders"&&',banner);if(a<0||b<a||b-a>3000)throw Error('R1629 global SMS banner missing');s=s.slice(0,a)+'false'+s.slice(b);s+=helper;}fs.writeFileSync(file,s);
 const css='photobridge-r1629-header-wallet.css';fs.writeFileSync(root+'/'+css,'.pb1629WalletNotice{display:flex;flex-direction:column;align-items:center;gap:1px;line-height:1.6;color:#9b4d13}.pb1629WalletNotice b{font-size:10px!important;font-weight:700}.pb1629WalletNotice small{font-size:9px;color:#667085}.headerWalletBadge:has(.pb1629WalletNotice),.mobileHeaderWallet:has(.pb1629WalletNotice){padding:5px 10px!important;background:#fff8ed!important;border-color:#f0d7ad!important}');
 const html=root+'/index.html';s=fs.readFileSync(html,'utf8');
 if(!s.includes(css))s=s.replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1629"></head>`);
 s=s.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('headerWallet=r1629')?url:url+'&headerWallet=r1629');
 s=s.replace(/(photobridge-lab-referral-program\.css\?[^"']*)/g,url=>url.includes('navigation=r1629')?url:url+'&navigation=r1629');
 fs.writeFileSync(html,s);
}
const root='dist/web/lab-desktop-ui',file=root+'/manifest.json',m=JSON.parse(fs.readFileSync(file)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1629-header-wallet.css']){let row=m.files.find(x=>x.name===name);if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row)}row.sha256=hash(fs.readFileSync(root+'/'+name))}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(m));
