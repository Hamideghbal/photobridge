import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(file,'utf8');
if(!js.includes('PB1112files')){
 const change=(a,b)=>{if(!js.includes(a))throw Error('R1112 UI anchor missing: '+a.slice(0,90));js=js.replace(a,b)};
 change('[g,p]=x.useState(!1),f={title:','[g,p]=x.useState(!1),[PB1112files,PB1112setFiles]=x.useState([]),[PB1112progress,PB1112setProgress]=x.useState(0),[PB1112publishing,PB1112setPublishing]=x.useState(""),PB1112draft=x.useRef(null),PB1112done=x.useRef(0),f={digitalPrice:"",orderingEnabled:!1,title:');
 change('const ae=await Me("/api/customer/client-galleries",{method:"POST",body:JSON.stringify(h)});m(!1),S({...f}),await y(),await I(ae.gallery.id)',`let ae=PB1112draft.current;if(!ae){ae=await Me("/api/customer/client-galleries",{method:"POST",body:JSON.stringify({...h,selectionEnabled:true,digitalPrice:Number(h.digitalPrice||0)})});PB1112draft.current=ae}
 for(let n=PB1112done.current;n<PB1112files.length;n++){
 const source=PB1112files[n],prepared=source.type.startsWith("image/")?await zf(source,{maxEdge:Number(t.billing.previewMaxEdge||1280),quality:Number(t.billing.previewQuality||58),watermarkEnabled:!!h.watermarkEnabled,watermarkText:String(h.watermarkText||"")}):source;
 const upload=await Me(\`/api/customer/client-galleries/\${ae.gallery.id}/media/presign\`,{method:"POST",body:JSON.stringify({name:prepared.name,contentType:prepared.type,bytes:prepared.size})});
 try{await rs(upload.uploadUrl,prepared,percent=>PB1112setProgress(Math.round((n+percent/100)/PB1112files.length*100)));await Me(\`/api/customer/client-galleries/\${ae.gallery.id}/media/\${upload.mediaId}/complete\`,{method:"POST"})}catch(error){await Me(\`/api/customer/client-galleries/\${ae.gallery.id}/media/\${upload.mediaId}\`,{method:"DELETE"}).catch(()=>{});throw error}
 PB1112done.current=n+1;
 }
 m(!1),S({...f}),PB1112setFiles([]),PB1112draft.current=null,PB1112done.current=0,await y()`);
 change('"ساخت گالری انجام نشد.")}finally{p(!1)}};','PB1112draft.current?"گالری ذخیره شده است؛ افزودن فایل‌ها کامل نشد. برای ادامه بدون ساخت دوباره، دوباره دکمه را بزن.":"ساخت گالری انجام نشد.")}finally{p(!1)}};const PB1112open=()=>{PB1112draft.current=null;PB1112done.current=0;PB1112setFiles([]);PB1112setProgress(0);S({...f});m(true)},PB1112publish=async gallery=>{PB1112setPublishing(gallery.id);try{await Me(`/api/customer/client-galleries/${gallery.id}`,{method:"PATCH",body:JSON.stringify({status:gallery.status==="published"?"draft":"published"})});await y()}catch{alert("تغییر وضعیت انتشار انجام نشد.")}finally{PB1112setPublishing("")}};');
 // Both entry points open a fresh form. Completion returns to cards, not a second settings page.
 js=js.replaceAll('onClick:()=>m(!0)','onClick:PB1112open');
 change('c&&e.jsx(On,{title:"گالری خصوصی جدید",onClose:()=>m(!1),children:', 'c&&e.jsx(On,{title:"گالری خصوصی جدید",dialogClassName:"pb1112CreateDialog",onClose:()=>{if(!g){m(!1);y()}},children:');
 change('e.jsx("small",{children:"قیمت فایل و تعرفه چاپ بعد از ساخت، داخل «مدیریت گالری» تنظیم می‌شوند."})','null');
 const priceUpload=`e.jsxs("section",{className:"pb1112CreateMedia",children:[e.jsxs("label",{className:"primary clientGalleryUploadBtn",children:["＋ افزودن عکس / ویدیو",e.jsx("input",{type:"file",multiple:true,accept:"image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm",disabled:g||!!PB1112draft.current,onChange:event=>{const files=Array.from(event.target.files||[]);if(files.filter(file=>file.type.startsWith("image/")).length>w)return alert("تعداد عکس‌ها بیشتر از ظرفیت گالری است.");PB1112setFiles(files);PB1112done.current=0}})]}),e.jsx("small",{children:PB1112files.length?V(PB1112files.length)+" فایل انتخاب شده":"عکس‌ها را همین‌جا اضافه کن؛ پس از ذخیره بارگذاری می‌شوند."}),e.jsx("ul",{children:PB1112files.map((file,index)=>e.jsx("li",{children:file.name},index))}),g&&PB1112files.length>0&&e.jsx("progress",{max:100,value:PB1112progress,"aria-label":"پیشرفت بارگذاری"})]}),e.jsxs("label",{children:["قیمت فایل دیجیتال (اختیاری · تومان)",e.jsx("input",{inputMode:"numeric",disabled:g||!!PB1112draft.current,value:Bn(h.digitalPrice),onChange:event=>{const value=String(Mn(event.target.value)||"");S({...h,digitalPrice:value,orderingEnabled:Number(value)>0&&h.orderingEnabled})},placeholder:"بدون قیمت"})]}),e.jsxs("label",{className:"clientGalleryOrderingToggle",children:["سفارش چاپ و فاکتور (انتخاب عکس فعال است)",e.jsx("input",{type:"checkbox",disabled:g||!!PB1112draft.current||!Number(h.digitalPrice),checked:!!h.orderingEnabled,onChange:event=>S({...h,orderingEnabled:event.target.checked,selectionEnabled:true})})]}),`;
 change('e.jsxs("div",{className:"modalActions",children:[e.jsx("button",{onClick:()=>m(!1),children:"انصراف"})',priceUpload+'e.jsxs("div",{className:"modalActions",children:[e.jsx("button",{disabled:g,onClick:()=>{m(!1);y()},children:"انصراف"})');
 change('children:g?"در حال ساخت…":C>F?', 'children:g?(PB1112files.length?"در حال ذخیره و بارگذاری…":"در حال ساخت…"):PB1112draft.current?"ادامه بارگذاری":C>F?');
 change('e.jsxs("div",{className:"clientGalleryCardActions",children:[','e.jsxs("div",{className:"clientGalleryCardActions",children:[e.jsx("button",{className:"pbActionButton primaryAction",disabled:!!PB1112publishing,onClick:()=>PB1112publish(L),children:PB1112publishing===L.id?"در حال ذخیره…":L.status==="published"?"برگردان به پیش‌نویس":"انتشار گالری"}),');
 change('e.jsx("button",{onClick:()=>window.open(l.share_url,"_blank","noopener,noreferrer"),children:"نمایش مشتری"}),e.jsx("button",{className:l.status==="published"?"dangerSoft primary":"primary",onClick:Le,children:l.status==="published"?"برگردان به پیش‌نویس":"انتشار گالری"})','null');
 change('orderingEnabled:!!l.ordering_enabled,watermarkEnabled:', 'selectionEnabled:!!l.selection_enabled||!!l.ordering_enabled,orderingEnabled:!!l.ordering_enabled,watermarkEnabled:');
 change('m({...c,orderingEnabled:Ee.target.checked})','m({...c,orderingEnabled:Ee.target.checked,selectionEnabled:Ee.target.checked||c.selectionEnabled})');
 fs.writeFileSync(file,js);
}
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('// R1112 gallery selection invariant')){
 // Persist the invariant on both create and update; existing inconsistent galleries work publicly too.
 server=server.replace('selectionEnabled: Boolean(row.selection_enabled), orderingEnabled:', 'selectionEnabled: Boolean(row.selection_enabled || row.ordering_enabled), orderingEnabled:');
 server=server.replace('walletTransactionId, selectionEnabled, orderingEnabled, watermarkEnabled,','walletTransactionId, selectionEnabled || orderingEnabled, orderingEnabled, watermarkEnabled,');
 server=server.replace('hash, selectionEnabled, orderingEnabled, watermarkEnabled,','hash, selectionEnabled || orderingEnabled, orderingEnabled, watermarkEnabled,');
 server=server.replace("'draft',0,$9,now()+($10::int||' days')::interval", "'draft',$19,$9,now()+($10::int||' days')::interval");
 server=server.replace('watermarkEnabled ? watermarkText : null, postCompletionDays]);','watermarkEnabled ? watermarkText : null, postCompletionDays, moneyAmount(b.digitalPrice)]); // R1112 gallery selection invariant');
 fs.writeFileSync('dist/api/server.js',server);
}
for(const page of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(page,'utf8').replace(/photobridge-v787-gallery-fix.js\?v=[^"']+/g,'photobridge-v787-gallery-fix.js?v=r1112').replace(/index-UIRefine-v655-r84.js\?v=[^"']+/g,'index-UIRefine-v655-r84.js?v=r1112');
 if(!html.includes('/photobridge-r1112-gallery-form.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1112-gallery-form.css?v=r1112">\n</head>');
 fs.writeFileSync(page,html);
}

let invariantServer=fs.readFileSync('dist/api/server.js','utf8').replace('selectionEnabled: Boolean(row.selection_enabled), orderingEnabled:','selectionEnabled: Boolean(row.selection_enabled || row.ordering_enabled), orderingEnabled:');
if(!invariantServer.includes('if (row.ordering_enabled) row.selection_enabled = true;'))invariantServer=invariantServer.replace('    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return null;','    if (row.ordering_enabled) row.selection_enabled = true;\n    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return null;');
fs.writeFileSync('dist/api/server.js',invariantServer);
