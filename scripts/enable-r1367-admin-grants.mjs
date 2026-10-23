import fs from 'node:fs';
const once=(s,a,b,label)=>{const count=s.split(a).length-1;if(count===1)return s.replace(a,b);if(count===0&&b&&s.includes(b))return s;throw Error('R1367 changed '+label)};
const file='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1367 replace legacy Windows activation tab */')){
 s=once(s,'"sms","windowsAlert","snappbox","site","desktop"','"sms","snappbox","site","desktop"','settings keys');
 s=once(s,'["windowsAlert","هشدار ویندوز"],','','legacy menu item');
 s=once(s,'g==="windowsAlert"&&e.jsx(qj,{}),g==="snappbox"','g==="snappbox"','legacy panel');
 s=once(s,'a[1]==="settings"&&a[2]?a[2]:location.hash','a[1]==="settings"&&a[2]?(a[2]==="windowsAlert"?"desktop":a[2]):location.hash','legacy route');
 s=once(s,'{id:"settings-windowsAlert",label:"هشدار ویندوز",hint:"Agent سیستم",icon:"!",url:"/lab/settings/windowsAlert"}','{id:"settings-desktop",label:"برنامهٔ ویندوز",hint:"دانلود برنامه",icon:"↧",url:"/lab/settings/desktop"}','quick access');
 s+='\n/* PB1367 replace legacy Windows activation tab */\n';
 fs.writeFileSync(file,s);
}
const header='dist/web/photobridge-r1147-lab-admin-header.js';let h=fs.readFileSync(header,'utf8');
h=h.replace("['general','hours','site','sms','windowsAlert','snappbox']","['general','hours','site','desktop','sms','snappbox']");fs.writeFileSync(header,h);
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
html=html.replace(/(photobridge-r1147-lab-admin-header\.js\?v=)[^&"'\s]+/g,'$1r1367');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&labAdminGrant=[^&"']*/g,'')+'&labAdminGrant=r1367');
fs.writeFileSync(htmlFile,html);
