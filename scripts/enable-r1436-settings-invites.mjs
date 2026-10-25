import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1436 settings and invitations */')){
 const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1436 changed anchor '+a.slice(0,90));ui=ui.replace(a,b)};
 once('"payment","walkin","hours"','"payment","walkin","walkin-prices","hours"');
 once('[["prices","تعرفه چاپ و صحافی"],["album","آلبوم‌ها"]','[["prices","تعرفه چاپ و صحافی"],["walkin-prices","تعرفه مشتری آزاد"],["album","آلبوم‌ها"]');
 once('g==="walkin"&&e.jsx(Qj,{})','g==="walkin"&&e.jsx(Qj,{}),g==="walkin-prices"&&e.jsx(Qj,{pricingOnly:!0})');
 once('function Qj(){','function Qj({pricingOnly=false}){');
 once('className:"walkinSettingsWorkspace",children:[e.jsxs("section",{className:"card panel compactPanel walkinLinkCard"','className:"walkinSettingsWorkspace",children:[!pricingOnly&&e.jsxs("section",{className:"card panel compactPanel walkinLinkCard"');
 once('e.jsxs("section",{className:"card panel compactPanel pricingSettingsCard walkinPricingCard"','pricingOnly&&e.jsxs("section",{className:"card panel pricingSettingsCard labPrintPricingCard walkinPricingCard"');
 once(';return e.jsxs("section",{className:"card panel photographerInviteManager "+(t?"compactPanel":"")',";if(H===\"lab\")return e.jsx(PB1436LabInvites,{invite:je,url:He,copy:De,create:Ge,creating:l,mobile:E,setMobile:value=>{C(value);B(null)},checkMobile:()=>void Ee(),debt:w,setDebt:F,send:we,busy:pbBusy,sending:L,previous:M,history:pbHistory,invites:a,resend:pbResend,notice:me,error:m,needCredit:X});return e.jsxs(\"section\",{className:\"card panel photographerInviteManager \"+(t?\"compactPanel\":\"\")");
 const start=ui.indexOf('function PB1435CorrectionView(');if(start<0)throw Error('R1436 correction view missing');
 ui=ui.slice(0,start)+fs.readFileSync('scripts/r1436-correction-view.js','utf8')+'\n'+fs.readFileSync('scripts/r1436-lab-invites.js','utf8')+'\n/* PB1436 settings and invitations */\n';
 fs.writeFileSync(file,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');if(!html.includes('photobridge-r1436-settings-invites.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1436-settings-invites.css?v=r1436" /></head>');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&settingsInvites=')?url:url+'&settingsInvites=r1436');fs.writeFileSync('dist/web/index.html',html);
