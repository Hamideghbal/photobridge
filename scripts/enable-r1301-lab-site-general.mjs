import fs from 'node:fs';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(bundle,'utf8');
const old='E=[{key:"site",label:"سایت اختصاصی",hint:"آدرس و ویرایش سایت",items:[["site","سایت اختصاصی"]]},{key:"general"';
if(ui.includes(old))ui=ui.replace(old,'E=[{key:"general"');
const general='items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"]]';
const withSite='items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"],["site","سایت اختصاصی"]]';
const grouped='items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"],["sms","پیامک مشتریان"],["windowsAlert","هشدار ویندوز"],["snappbox","اسنپ و ارسال"]]';
const groupedWithSite=grouped.slice(0,-1)+',["site","سایت اختصاصی"]]';
if(ui.includes(general))ui=ui.replace(general,withSite);
else if(ui.includes(grouped))ui=ui.replace(grouped,groupedWithSite);
else if(!ui.includes(withSite)&&!ui.includes(groupedWithSite)){
 // Newer navigation renders settings as route-backed cards rather than the
 // legacy General tab item list. Preserve that already-grouped UI unchanged.
 const modernSettings=ui.includes('id:"settings-general"')&&ui.includes('id:"settings-hours"');
 if(!modernSettings)throw Error('R1301 general settings anchor changed');
}
fs.writeFileSync(bundle,ui);
const file='dist/web/index.html';let html=fs.readFileSync(file,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&siteGeneral=[^&"']*/g,'')+'&siteGeneral=r1301');html=html.replace(/(photobridge-r1147-lab-admin-header\.js\?[^"']*)/g,u=>u.replace(/&siteGeneral=[^&"']*/g,'')+'&siteGeneral=r1301');fs.writeFileSync(file,html);

