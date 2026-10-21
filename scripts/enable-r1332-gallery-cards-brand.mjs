import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const asset='photobridge-r1332-gallery-cards.css',bundle='index-UIRefine-v655-r84.js',file='dist/web/assets/'+bundle;
let source=fs.readFileSync(file,'utf8');
if(!source.includes('clientGalleryCard card pb1332Card')){
 const start=source.indexOf('e.jsxs("article",{className:"clientGalleryCard card",children:['),end=source.indexOf(']},L.id))',start)+8;
 if(start<0||end<start)throw Error('R1332 gallery card boundary missing');
 const old=source.slice(start,end),deleteStart=old.indexOf('e.jsx("button",{type:"button",className:"pbActionButton pb1160GalleryDelete"'),deleteEnd=old.indexOf(']}),e.jsxs("div",{className:"pb1161GalleryBottomRow"',deleteStart);
 if(deleteStart<0||deleteEnd<0)throw Error('R1332 existing delete action missing');
 const deleteNode=old.slice(deleteStart,deleteEnd);
 const card=`e.jsxs("article",{className:"clientGalleryCard card pb1332Card","data-order-status":L.current_order_status||"empty",children:[
 e.jsxs("div",{className:"clientGalleryCardCover",children:[e.jsx("span",{className:"pb1332CardEyebrow",children:"گالری مشتری"}),e.jsx("span",{className:"clientGalleryStatus "+L.status,children:L.status==="published"?"فعال":L.status==="closed"?"بسته":"غیرفعال"})]}),
 e.jsxs("div",{className:"clientGalleryCardBody",children:[
 e.jsx("div",{className:"pb1158CardHeading",children:e.jsx("h3",{title:L.title,children:L.title})}),
 e.jsxs("p",{className:"pb1332Customer",children:[e.jsx("span",{children:L.customer_name}),L.customer_mobile&&e.jsx("bdi",{children:L.customer_mobile})]}),
 e.jsxs("div",{className:"clientGalleryMetrics",children:[e.jsxs("span",{children:[e.jsx("b",{children:V(L.photo_count||0)}),e.jsx("small",{children:"عکس"})]}),e.jsxs("span",{children:[e.jsx("b",{children:L.current_order_status?"۱":"۰"}),e.jsx("small",{children:"سفارش فعال"})]}),e.jsxs("span",{children:[e.jsx("b",{children:vi(L.ordered_total)}),e.jsx("small",{children:"مبلغ سفارش"})]})]}),
 e.jsx("div",{className:"clientGalleryOrderState",children:Ec(L.current_order_status)}),
 e.jsxs("div",{className:"clientGalleryExpiryMini pb1332CardExpiry",children:[e.jsx("span",{children:L.expires_at?e.jsxs(e.Fragment,{children:["مهلت گالری تا ",e.jsx("b",{children:vn(L.expires_at)})]}):"بدون محدودیت زمانی"})]}),
 e.jsxs("div",{className:"clientGalleryCardActions pb1160GalleryActions pb1332Actions",children:[
 e.jsxs("div",{className:"pb1332PrimaryRow",children:[e.jsx("button",{className:"pbActionButton primaryAction pb1332Manage",onClick:()=>I(L.id),children:["submitted","retouching","awaiting_approval"].includes(String(L.current_order_status))?"انتخاب‌ها و روتوش":"مدیریت گالری"}),e.jsx("button",{className:"pbActionButton secondaryAction",onClick:()=>window.open(L.share_url,"_blank","noopener,noreferrer"),children:"نمایش مشتری"})]}),
 e.jsxs("div",{className:"pb1332SecondaryRow",children:[e.jsx("button",{className:"pbActionButton secondaryAction",disabled:!!PB1112publishing,onClick:()=>PB1112publish(L),children:PB1112publishing===L.id?"در حال ذخیره…":L.status==="published"?"غیرفعال کردن":"فعال کردن"}),e.jsx("button",{className:"pbActionButton secondaryAction",onClick:async()=>{await bh(L.share_url),window.pb1113GalleryNotice("لینک خصوصی کپی شد.")},children:"کپی لینک"}),${deleteNode}]})]})]})]},L.id)`;
 source=source.slice(0,start)+card+source.slice(end);fs.writeFileSync(file,source);
}
// Renewal stays next to its deadline; it must not create a third row of card actions.
const runtime='dist/web/photobridge-v791-runtime-fix.js';let js=fs.readFileSync(runtime,'utf8');
js=js.replace("let renew=qs('.pb792RenewGallery',actions);","let renew=qs('.pb792RenewGallery',card);").replace("actions.appendChild(renew)","(qs('.pb1332CardExpiry',card)||actions).appendChild(renew)");fs.writeFileSync(runtime,js);
const src='apps/web/public/photobridge-v791-runtime-fix.js';if(fs.existsSync(src)){let original=fs.readFileSync(src,'utf8');original=original.replace("let renew=qs('.pb792RenewGallery',actions);","let renew=qs('.pb792RenewGallery',card);").replace("actions.appendChild(renew)","(qs('.pb1332CardExpiry',card)||actions).appendChild(renew)");fs.writeFileSync(src,original);}
function walk(dir){if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const target=path.join(dir,item.name);if(item.isDirectory()){walk(target);continue;}if(!item.name.endsWith('.html'))continue;
 let html=fs.readFileSync(target,'utf8');if(!html.includes('photobridge-r1126-desktop-navigation.js'))continue;
 const prefix=html.match(/src=["']([^"']*)photobridge-r1126-desktop-navigation\.js/)?.[1]??'/';
 if(!html.includes(asset))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}${asset}?v=r1332"></head>`);
 for(const [name,param] of [[bundle,'cards'],['photobridge-v791-runtime-fix.js','cards']])html=html.replaceAll(new RegExp('('+name.replaceAll('.','\\.')+')([^"\'<>\\s]*)','g'),(_,n,q)=>n+q.replace(new RegExp('[?&]'+param+'=[^&]*','g'),'')+(q.includes('?')?'&':'?')+param+'=r1332');
 fs.writeFileSync(target,html);
 if(prefix==='./'||prefix===''){
  for(const name of [asset,'photobridge-v791-runtime-fix.js'])fs.copyFileSync('dist/web/'+name,path.join(dir,name));
  const dest=path.join(dir,'assets',bundle);if(fs.existsSync(dest))fs.copyFileSync(file,dest);
 }
}}
walk('dist/web');walk('dist/api');
for(const channel of ['desktop-ui','lab-desktop-ui']){
 const root=path.resolve('dist/web',channel),manifestPath=path.join(root,'manifest.json');if(!fs.existsSync(manifestPath))continue;const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 if(!manifest.files.some(entry=>entry.name===asset))manifest.files.push({name:asset,url:`/${channel}/${asset}`,sha256:''});
 for(const entry of manifest.files){const target=path.resolve(root,entry.name);if(!target.startsWith(root+path.sep))throw Error('Invalid desktop manifest path');entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')}
 manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}
console.log('[R1332] Refined gallery cards and two-row actions.');
