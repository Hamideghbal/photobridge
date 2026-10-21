import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const cssFile='dist/web/photobridge-r1332-gallery-cards.css';
let js=fs.readFileSync(bundle,'utf8');
function apply(before,after,name){
 if(js.includes(after))return;
 const hits=js.split(before).length-1;
 if(hits!==1)throw new Error('R1338 '+name+' expected one anchor, found '+hits);
 js=js.replace(before,after);
}
// Other uploads already supply a progress callback; retouch historically did
// not, so upload progress events called undefined and threw in the browser.
apply(
 'h.lengthComputable&&s(Math.max(1,Math.min(100,Math.round(h.loaded/h.total*100))))',
 'h.lengthComputable&&typeof s==="function"&&s(Math.max(1,Math.min(100,Math.round(h.loaded/h.total*100))))',
 'optional progress callback'
);
apply(
 '[F,M]=x.useState(""),[PB1337uploads,PB1337setUploads]=x.useState({}),[B,L]=x.useState(!1)',
 '[F,M]=x.useState(""),[PB1337uploads,PB1337setUploads]=x.useState({}),[PB1338progress,PB1338setProgress]=x.useState(0),[PB1338stage,PB1338setStage]=x.useState(""),[B,L]=x.useState(!1)',
 'per-photo progress state'
);
apply(
 'Ke=async(Ee,we)=>{var H;if(!(!we||!O)){M(Ee);try{const z=await zf(we,{maxEdge:1280,quality:58,watermarkEnabled:!1,watermarkText:""}),q=await Me(',
 'Ke=async(Ee,we)=>{var H;if(!(!we||!O)){M(Ee),PB1338setProgress(2),PB1338setStage("آماده‌سازی");try{if(!["image/jpeg","image/png","image/webp"].includes(String(we.type||"").toLowerCase()))throw new Error("unsupported_image_type");let z=await zf(we,{maxEdge:1280,quality:58,watermarkEnabled:!1,watermarkText:""});for(let round=0;z.size>980*1024&&round<3;round++)z=await zf(z,{maxEdge:1000-round*50,quality:48-round*3,watermarkEnabled:!1,watermarkText:""});if(z.size>1024*1024)throw Object.assign(new Error("gallery_retouch_preview_too_large"),{data:{error:"gallery_retouch_preview_too_large"}});PB1338setProgress(7),PB1338setStage("دریافت مجوز");const q=await Me(',
 'retouch upload stage init'
);
apply(
 'await rs(q.uploadUrl,z),await Me(',
 'PB1338setProgress(10),PB1338setStage("انتقال فایل");await rs(q.uploadUrl,z,p=>PB1338setProgress(Math.min(92,10+Math.round(p*.82))));PB1338setProgress(94),PB1338setStage("ثبت روی سرور");await Me(',
 'real network upload progress'
);
apply(
 'await o()}catch(z){window.pb1113GalleryNotice(((H=z==null?void 0:z.data)==null?void 0:H.error)==="gallery_retouch_preview_too_large"?"نمونه روتوش هنوز حجم بالایی دارد.":"آپلود نمونه روتوش انجام نشد.")}finally{M("")}',
 'await o(),PB1338setProgress(100),PB1338setStage("تکمیل شد")}catch(z){const code=String(z?.data?.error||z?.message||"upload_failed");const msg=code==="gallery_retouch_preview_too_large"?"حجم نمونه روتوش از یک مگابایت بیشتر است؛ عکس کم‌حجم‌تری انتخاب کن.":code==="gallery_image_decode_failed"||code==="gallery_preview_encode_failed"?"خواندن یا فشرده‌سازی عکس انجام نشد؛ عکس JPG یا PNG دیگری انتخاب کن.":code==="unsupported_image_type"?"فرمت عکس باید JPG، PNG یا WEBP باشد.":code==="upload_not_configured"||code==="local_upload_disabled"?"فضای ذخیره‌سازی آپلود در سرور فعال نیست.":code==="gallery_order_media_not_found"||code==="gallery_order_invalid_state"?"وضعیت سفارش برای روتوش جدید معتبر نیست؛ صفحه را بررسی کن.":code==="upload_missing"||code==="size_mismatch"?"فایل به‌صورت کامل به سرور نرسید؛ دوباره تلاش کن.":code.startsWith("upload_http_")?"ارسال فایل با خطای سرور ("+code.slice(12)+") انجام نشد.":code==="upload_failed"||code==="upload_network_error"?"انتقال فایل قطع شد؛ اتصال اینترنت را بررسی و دوباره تلاش کن.":"آپلود روتوش ناموفق بود ("+code+").";PB1338setStage("خطا"),window.pb1113GalleryNotice(msg)}finally{M(""),PB1338setProgress(0),PB1338setStage("")}',
 'success and explicit errors'
);
apply(
 'c.onload=()=>p(()=>c.status>=200&&c.status<300?o():l(new Error("upload_failed"))),c.onerror=()=>p(()=>l(new Error("upload_failed")))',
 'c.onload=()=>p(()=>c.status>=200&&c.status<300?o():l(new Error("upload_http_"+c.status))),c.onerror=()=>p(()=>l(new Error("upload_network_error")))',
 'HTTP and network error distinction'
);
apply(
 'children:[F===Ee.mediaId?"در حال آپلود…":Ee.retouch?"تعویض نمونه روتوش":"بارگذاری نمونه روتوش",e.jsx("input",{type:"file"',
 'children:[e.jsx("span",{className:"pb1338UploadFill",style:{width:F===Ee.mediaId?PB1338progress+"%":"0%"}}),e.jsx("span",{className:"pb1338UploadText",role:F===Ee.mediaId?"progressbar":void 0,"aria-label":F===Ee.mediaId?"انتقال عکس روتوش":void 0,"aria-valuemin":0,"aria-valuemax":100,"aria-valuenow":PB1338progress,children:F===Ee.mediaId?PB1338stage+" · "+V(PB1338progress)+"٪":Ee.retouch?"تعویض نمونه روتوش":"بارگذاری نمونه روتوش"}),e.jsx("input",{type:"file"',
 'in-button progress bar'
);
fs.writeFileSync(bundle,js);
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* R1338 in-button upload progress */')){
 css+='\n/* R1338 in-button upload progress */\n'
 +'.clientGalleryRetouchUpload{position:relative!important;isolation:isolate;overflow:hidden!important;min-height:38px!important;transition:border-color .2s}\n'
 +'.clientGalleryRetouchUpload .pb1338UploadFill{position:absolute;inset-inline-start:0;top:0;bottom:0;width:0;max-width:100%;background:linear-gradient(90deg,#bbd0ff,#a3d5ff);opacity:.75;z-index:0;pointer-events:none;transition:width .18s linear}\n'
 +'.clientGalleryRetouchUpload .pb1338UploadText{position:relative;z-index:1;display:inline-block;white-space:normal;text-align:center;line-height:1.7;pointer-events:none}\n'
 +'.clientGalleryRetouchUpload.disabled{pointer-events:none!important;opacity:1!important}\n';
}
fs.writeFileSync(cssFile,css);

function refreshHtml(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){refreshHtml(file);continue;}
  if(!file.endsWith('.html'))continue;
  const before=fs.readFileSync(file,'utf8');
  if(!before.includes('retouchReload=r1337'))continue;
  fs.writeFileSync(file,before.replaceAll('retouchReload=r1337','retouchReload=r1338'));
 }
}
refreshHtml('dist/web');
refreshHtml('dist/api');
for(const channel of ['desktop-ui','lab-desktop-ui']){
 const root=path.resolve('dist/web',channel);
 const bundleDest=path.join(root,'assets/index-UIRefine-v655-r84.js');
 const cssDest=path.join(root,'photobridge-r1332-gallery-cards.css');
 if(fs.existsSync(bundleDest))fs.copyFileSync(bundle,bundleDest);
 if(fs.existsSync(cssDest))fs.copyFileSync(cssFile,cssDest);
 const manifestPath=path.join(root,'manifest.json');
 if(!fs.existsSync(manifestPath))continue;
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 for(const entry of manifest.files){
  const file=path.resolve(root,entry.name);
  if(!file.startsWith(root+path.sep))throw Error('R1338 invalid desktop package entry');
  entry.sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 }
 manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
 fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
}

console.log('[R1338] Safe retouch upload events, stage-aware progress bar and precise failure messages.');
