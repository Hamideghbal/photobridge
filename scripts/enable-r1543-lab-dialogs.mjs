import fs from 'node:fs';
import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bundle='assets/index-UIRefine-v655-r84.js',css='photobridge-r1543-lab-dialogs.css',nav='photobridge-r1372-third-header.js';
let js=fs.readFileSync('dist/web/'+bundle,'utf8');
if(!js.includes('/* PB1543 styled catalog dialogs and customer details */')){
 const one=(a,b)=>{if(js.split(a).length!==2)throw Error('R1543 changed anchor: '+a.slice(0,100));js=js.replace(a,b)};
 const a=js.indexOf('const pb1539Create=async(kind="binding")=>'),b=js.indexOf('const h=[["luster",pb1539Label',a);if(a<0||b<a)throw Error('R1543 catalog handlers unavailable');
 js=js.slice(0,a)+`const pb1539Create=async(kind="binding")=>pb1543CatalogDialog({title:kind==="chassis"?"شاسی جدید":kind==="frame"?"قاب جدید":"صحافی جدید",description:"نام مدل را وارد کنید؛ می‌توانید مشخصات آن را در نام بنویسید.",inputLabel:"نام مدل",submitLabel:"افزودن مدل",onSubmit:async name=>{await Me("/api/lab/print-catalog",{method:"POST",body:JSON.stringify({kind,name})});await pb1539Reload()}});
const pb1539Rename=async(id,old)=>pb1543CatalogDialog({title:"ویرایش نام مدل",description:"نام جدید این مدل را وارد کنید.",inputLabel:"نام مدل",initialValue:old,submitLabel:"ذخیره نام",onSubmit:async name=>{if(name===old)return;await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({id,name})});await pb1539Reload()}});
const pb1539Delete=async(id,name)=>pb1543CatalogDialog({title:"حذف مدل",description:"مدل «"+name+"» از تعرفه‌های قابل انتخاب حذف شود؟ سفارش‌ها، قیمت‌های ثبت‌شده و فاکتورهای قبلی حفظ می‌شوند.",confirmation:true,submitLabel:"حذف مدل",onSubmit:async()=>{await Me("/api/lab/print-catalog/type",{method:"PATCH",body:JSON.stringify({id,active:false})});await pb1539Reload()}});
`+js.slice(b);
 one('children:"+ مدل صحافی جدید"','children:"صحافی جدید"');
 one('e.jsx(On,{title:f?"ویرایش سایز چاپ":"افزودن سایز چاپ",onClose:a,children:', 'e.jsx(On,{title:f?"ویرایش سایز چاپ":"افزودن سایز چاپ",dialogClassName:"pb1543SizeDialog",onClose:a,children:');
 const cleanupOld="if(!confirm('پوشه‌های تاریخ‌دار قدیمی‌تر از مدت نگهداری، در مسیر فعال همین سیستم پاک شوند؟'))return;";
 if(js.includes(cleanupOld))one(cleanupOld,'if(!await pb1540CleanupConfirm())return;');
 else if(!js.includes('if(!await pb1540CleanupConfirm())return;'))throw Error('R1543 cleanup confirmation missing');
 const tag='h.registrationPending&&e.jsx("span",{className:"pb1446PendingTag",title:"عکاس هنوز دعوت‌نامه را نپذیرفته است",children:"پیش‌ثبت‌نام"})';
 one('e.jsxs("b",{className:"pb1446PhotographerName",children:[h.name,'+tag+']})','e.jsx("b",{className:"pb1446PhotographerName",children:h.name})');
 one('e.jsx("small",{dir:"ltr",children:h.mobile||"بدون شماره موبایل"})','e.jsx("small",{dir:"ltr",children:h.mobile||"بدون شماره موبایل"}),'+tag);
 one("children:'بدهی اولیه / اصلاح'}),open&&e.jsx(PB1473DebtModal", "children:'بدهی اولیه / اصلاح'}),e.jsx(PB1543OpeningDebtPreview,{customerId,amount:data?.initialDebt}),open&&e.jsx(PB1473DebtModal");
 js+='\n/* PB1543 styled catalog dialogs and customer details */\n'+fs.readFileSync('scripts/r1543-catalog-dialog.js.txt','utf8');fs.writeFileSync('dist/web/'+bundle,js);
}
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 let navigation=fs.readFileSync(root+'/'+nav,'utf8');const old="if(data.kind==='pricing')label=raw.includes('چاپ')?'چاپ':raw.includes('جدید')?'سایز جدید':raw.includes('ذخیره')?(original.disabled?'در حال ذخیره…':'ذخیره'):raw;",fixed="if(data.kind==='pricing')label=raw.includes('صحافی')?'صحافی جدید':raw.includes('چاپ')?'چاپ':raw.includes('جدید')?'سایز جدید':raw.includes('ذخیره')?(original.disabled?'در حال ذخیره…':'ذخیره'):raw;";
 if(!navigation.includes(fixed)){if(navigation.split(old).length!==2)throw Error('R1543 pricing action labels changed');navigation=navigation.replace(old,fixed);fs.writeFileSync(root+'/'+nav,navigation)}
 if(root.endsWith('lab-desktop-ui')){fs.copyFileSync('dist/web/'+css,root+'/'+css);const native=js.replace('const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"','const ai=()=>typeof window.showDirectoryPicker=="function"');if(!native.includes('const ai=()=>typeof window.showDirectoryPicker=="function"'))throw Error('R1543 native storage capability changed');fs.writeFileSync(root+'/'+bundle,native)}
 let html=fs.readFileSync(root+'/index.html','utf8');if(!html.includes(css))html=html.replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1543"></head>`);html=html.replace(/((?:index-UIRefine-v655-r84|photobridge-r1372-third-header)\.js\?[^"']*)/g,u=>u.includes('&labDialogs=r1543')?u:u+'&labDialogs=r1543');fs.writeFileSync(root+'/index.html',html);
}
const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1543 native contract changed');for(const name of [bundle,css,nav,'index.html']){const sha256=hash(fs.readFileSync(root+'/'+name)),entry=manifest.files.find(f=>f.name===name);if(entry)entry.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});}manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));
console.log('[PhotoBridge R1543] styled dialogs and photographer details delivered to site and native');
