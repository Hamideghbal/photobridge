import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const bundle='index-UIRefine-v655-r84.js',file='dist/web/assets/'+bundle,css='photobridge-r1331-gallery-retouch-sms.css';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('function PB1331GallerySms(')){
 const start=source.indexOf('function G0('),end=source.indexOf('function PB1200GalleryStamp(',start);
 if(start<0||end<0)throw Error('R1331 gallery manager boundary missing');
 let manager=source.slice(start,end);
 const patch=(before,after)=>{if(!manager.includes(before))throw Error('R1331 missing gallery anchor '+before.slice(0,80));manager=manager.replace(before,after)};
 patch('[PBv,PBsetV]=x.useState("all")','[PBv,PBsetV]=x.useState(()=>["submitted","retouching","awaiting_approval","completed"].includes(String(t.currentOrder?.status))?"selected":"all")');
 patch('children:"عکس‌های انتخاب‌شده"','children:"انتخاب‌ها و روتوش"');
 patch('),null,e.jsxs("div",{className:"clientGalleryManagerGrid"', '),e.jsx(PB1331GallerySms,{galleryId:l.id,orderStatus:O?.status,updatedAt:l.updated_at}),O&&PBv==="all"&&e.jsx("button",{type:"button",className:"pb1331RetouchEntry",onClick:()=>PBsetV("selected"),children:"مشاهده انتخاب‌های مشتری و ارسال عکس روتوش‌شده"}),e.jsxs("div",{className:"clientGalleryManagerGrid"');
 patch('e.jsxs("div",{className:"clientGalleryWorkflowActions",children:[','O.status==="draft"&&e.jsx("p",{role:"status",children:"انتخاب‌های مشتری هنوز نهایی نشده‌اند؛ پس از ثبت نهایی مشتری می‌توانی نسخه‌های روتوش‌شده را بارگذاری و برای تأیید بفرستی."}),e.jsxs("div",{className:"clientGalleryWorkflowActions",children:[');
 patch('await Me(`/api/customer/client-galleries/${l.id}/orders/${O.id}/action`,{method:"POST",body:JSON.stringify({action:Ee})}),await o()', 'const result=await Me(`/api/customer/client-galleries/${l.id}/orders/${O.id}/action`,{method:"POST",body:JSON.stringify({action:Ee})});await o();if(result.sms?.error)window.pb1113GalleryNotice("روتوش برای تأیید مشتری آماده شد، اما پیامک ارسال نشد. "+PB1331smsError(result.sms.error));else if(result.sms?.sent)window.pb1113GalleryNotice("روتوش آماده شد و لینک تأیید برای مشتری پیامک شد.")');
 source=source.slice(0,start)+fs.readFileSync('scripts/r1331-gallery-components.js','utf8')+'\n'+manager+source.slice(end);
 const old='onClick:()=>I(L.id),children:"مدیریت گالری"';
 if(!source.includes(old))throw Error('R1331 gallery card entry missing');
 source=source.replace(old,'onClick:()=>I(L.id),children:["submitted","retouching","awaiting_approval"].includes(String(L.current_order_status))?"انتخاب‌ها و روتوش":"مدیریت گالری"');
 fs.writeFileSync(file,source);
}
const helperStart=source.indexOf('function PB1331smsError('),helperEnd=source.indexOf('function G0(',helperStart);
if(helperStart<0||helperEnd<0)throw Error('R1331 component sync boundary missing');
source=source.slice(0,helperStart)+fs.readFileSync('scripts/r1331-gallery-components.js','utf8')+'\n'+source.slice(helperEnd);
fs.writeFileSync(file,source);
function walk(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const target=path.join(dir,item.name);if(item.isDirectory()){walk(target);continue;}if(!item.name.endsWith('.html'))continue;
 let html=fs.readFileSync(target,'utf8');if(!html.includes('photobridge-r1126-desktop-navigation.js'))continue;
 const prefix=html.match(/src=["']([^"']*)photobridge-r1126-desktop-navigation\.js/)?.[1]??'/';
 if(!html.includes(css))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}${css}?v=r1331"></head>`);
 html=html.replace(/(index-UIRefine-v655-r84\.js)([^"'<>\s]*)/g,(_,name,q)=>name+q.replace(/[?&]retouchSms=[^&]*/g,'')+(q.includes('?')?'&':'?')+'retouchSms=r1331');
 fs.writeFileSync(target,html);
 if(prefix==='./'||prefix===''){
  fs.copyFileSync('dist/web/'+css,path.join(dir,css));
  const dest=path.join(dir,'assets',bundle);if(fs.existsSync(dest))fs.copyFileSync(file,dest);
 }
}}
walk('dist/web');walk('dist/api');
for(const channel of ['desktop-ui','lab-desktop-ui']){
 const root=path.resolve('dist/web',channel),manifestPath=path.join(root,'manifest.json');if(!fs.existsSync(manifestPath))continue;
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 // Register newly copied CSS too, so offline updaters fetch it.
 if(!manifest.files.some(entry=>entry.name===css))manifest.files.push({name:css,url:`/${channel}/${css}`,sha256:''});
 for(const entry of manifest.files){const asset=path.resolve(root,entry.name);if(!asset.startsWith(root+path.sep))throw Error('Invalid desktop manifest path');entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex')}
 manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log('[R1331] Direct retouch workflow and optional gallery SMS controls.');
