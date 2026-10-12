import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('pb1158Intro')){
 const start=ui.indexOf('e.jsxs("section",{className:"clientGalleryIntro card",children:[');
 const end=ui.indexOf(',e.jsxs("div",{className:"clientGalleryPolicyLine"',start);
 if(start<0||end<start)throw Error('Gallery intro not found');
 const intro=ui.slice(start,end).replace('e.jsxs("section",{className:"clientGalleryIntro card",children:[','e.jsxs("details",{className:"clientGalleryIntro card pb1158Intro",open:!0,children:[e.jsx("summary",{children:"انتخاب عکس، روتوش و تأیید مشتری در یک مسیر"}),').replace('e.jsx("h2",{children:"انتخاب عکس، روتوش و تأیید مشتری در یک مسیر"}),','');
 ui=ui.slice(0,start)+intro+ui.slice(end);
 const a=ui.indexOf('e.jsxs("div",{className:"clientGalleryMetrics"');
 const b=ui.indexOf(',e.jsx("div",{className:"clientGalleryExpiryMini"',a);
 if(a<0||b<a)throw Error('Gallery metrics not found');
 const metrics=ui.slice(a,b);ui=ui.slice(0,a)+ui.slice(b+1);
 const title='e.jsx("h3",{children:L.title})';
 ui=ui.replace(title,'e.jsxs("div",{className:"pb1158CardHeading",children:['+title+','+metrics+']})');
}
ui=ui.replace('m({...c,accessCode:""}),await o(),window.pb1113GalleryNotice("تنظیمات گالری ذخیره شد.")','r()');
fs.writeFileSync(file,ui);
