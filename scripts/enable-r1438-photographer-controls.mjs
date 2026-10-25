import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1438 photographer controls */')){
 const a=ui.indexOf('function Kj('),b=ui.indexOf('function wb(',a);if(a<0||b<a)throw Error('R1438 customer component');let part=ui.slice(a,b);
 const passStart=part.indexOf('e.jsx("button",{className:"pbActionButton compact customerActionButton",title:"تغییر رمز عبور"'),passEnd=part.indexOf('e.jsx("button",{className:"pbActionButton compact customerActionButton "+',passStart);if(passStart<0||passEnd<passStart)throw Error('R1438 password action');part=part.slice(0,passStart)+part.slice(passEnd);
 const delStart=part.indexOf(',e.jsx("button",{className:"customerDeleteIcon"'),delEnd=part.indexOf(']})]},h.id)',delStart);if(delStart<0||delEnd<delStart)throw Error('R1438 delete action');part=part.slice(0,delStart)+part.slice(delEnd);
 const mapStart=part.indexOf('e.jsx("a",{className:"labMapLink"'),mapEnd=part.indexOf(',e.jsx("button",{type:"button",className:"labLocationCopy"',mapStart);if(mapStart<0||mapEnd<mapStart)throw Error('R1438 map action');part=part.slice(0,mapStart)+'e.jsx(PB1438LocationMap,{customer:h})'+part.slice(mapEnd);
 ui=ui.slice(0,a)+part+ui.slice(b);
 const intro="className:'pb1436InviteControls',children:[";if(ui.split(intro).length!==2)throw Error('R1438 invite layout');ui=ui.replace(intro,intro+"e.jsx('p',{className:'pb1438InviteIntro',children:'لینک را کپی کنید و برای عکاس بفرستید، یا شماره موبایل را وارد کنید تا دعوت‌نامه پیامک شود؛ بدهی قبلی فقط در صورت وجود مانده حساب ثبت شود.'}),");
 ui+='\n/* PB1438 photographer controls */\n'+fs.readFileSync('scripts/r1438-location-map.js','utf8');fs.writeFileSync(file,ui);
}
const headerFile='dist/web/photobridge-r1372-third-header.js';let header=fs.readFileSync(headerFile,'utf8');if(header.includes('دفتر همکاری')){header=header.replaceAll('دفتر همکاری','درخواست همکاری');fs.writeFileSync(headerFile,header)}
let html=fs.readFileSync('dist/web/index.html','utf8');if(!html.includes('photobridge-r1438-photographer-controls.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1438-photographer-controls.css?v=r1438" /></head>');html=html.replace(/(photobridge-r1372-third-header\.js)(?:\?[^"'<>\s]*)?/g,'$1?v=r1438');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&photographerControls=')?url:url+'&photographerControls=r1438');fs.writeFileSync('dist/web/index.html',html);
