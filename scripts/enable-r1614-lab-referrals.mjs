import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const replaceOne=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1614 UI anchor count '+n+':'+a.slice(0,55));return s.replace(a,b)};
write('dist/api/lab-referral-server-patch.js',read('scripts/r1614-lab-referral-server-patch.js.txt'));
const {patchLabReferralServer}=await import('../dist/api/lab-referral-server-patch.js');
write('dist/api/server.js',patchLabReferralServer(read('dist/api/server.js')));
for(const f of ['dist/api/server.js','dist/api/lab-referrals.js','dist/api/lab-referral-policy.js','dist/api/lab-referral-wallet-renewal.js','dist/api/lab-referral-server-patch.js'])
 execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
const ui=read('scripts/r1614-lab-referral-ui.js.txt');
const css='photobridge-r1614-lab-referrals.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const app=root+'/assets/index-UIRefine-v655-r84.js';
 let s=read(app);
 if(!s.includes('/* PB1614 lab referrals UI */')){
 s=replaceOne(s,'const c=new Set(["general","subscription","wallet","customers","prices","album","payment","walkin","hours","resolution","local","sms","windowsAlert","snappbox","site","backup"])',
  'const c=new Set(["general","subscription","wallet","customers","referrals","prices","album","payment","walkin","hours","resolution","local","sms","windowsAlert","snappbox","site","backup"])');
 s=replaceOne(s,'["customers","عکاسی‌ها و همکاری"],["walkin","مشتری آزاد / QR"]',
  '["customers","عکاسی‌ها و همکاری"],["referrals","دعوت لابراتوارها"],["walkin","مشتری آزاد / QR"]');
 s=replaceOne(s,'g==="subscription"&&e.jsx(Gj,{})','g==="subscription"&&e.jsx(Gj,{}),g==="referrals"&&e.jsx(PB1614LabReferrals,{})');
 s=replaceOne(s,'function u0(){var k,E;const[t,a]=x.useState({labName:"",adminName:""',
  'function u0(){var k,E;const[t,a]=x.useState({labReferralCode:new URLSearchParams(location.search).get("labReferral")||"",labName:"",adminName:""');
 s=replaceOne(s,'mobile:t.mobile,password:t.password})','mobile:t.mobile,password:t.password,labReferralCode:t.labReferralCode})');
 s=replaceOne(s,'e.jsx("h2",{children:"اطلاعات اولیه"})',
  'e.jsx("h2",{children:"اطلاعات اولیه"}),t.labReferralCode&&e.jsx("p",{className:"pb1614ReferralSignupOffer",children:"با دعوت‌نامه لابراتوار وارد شده‌اید؛ پس از تأیید عضویت ۳۰٪ تخفیف اشتراک می‌گیرید."})');
 s+='\n'+ui+'\n/* PB1614 lab referrals UI */\n';
 write(app,s);
 }
 execFileSync(process.execPath,['--check',app],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1614-lab-referral-ui.css',root+'/'+css);
 const htmlFile=root+'/index.html';
 let html=read(htmlFile);
 const tag='<link rel="stylesheet" href="/'+css+'?v=r1614">';
 if(!html.includes(tag))html=replaceOne(html,'</head>',tag+'\n</head>');
 const pattern=/index-UIRefine-v655-r84\.js\?[^"']+/g;
 if((html.match(pattern)||[]).length!==1)throw Error('R1614 app entry URL changed');
 html=html.replace(pattern,t=>t.includes('&labReferral=r1614')?t:t+'&labReferral=r1614');
 write(htmlFile,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestFile=root+'/manifest.json',m=JSON.parse(read(manifestFile));
  if(m.protocol!==1||m.channel!=='lab'||!Array.isArray(m.files))throw Error('R1614 native manifest changed');
  for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',css]){
   let row=m.files.find(x=>x.name===name);
   if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row)}
   row.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  write(manifestFile,JSON.stringify(m));
 }
}
console.log('[R1614] Lab-to-lab referral feature prepared in web and Windows Lab UI');
