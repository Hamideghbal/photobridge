import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
// R1610 runs after the existing UI patches. This keeps web and Windows native UI in sync.
const replacement="function PB1585Discount({customer,onSaved}){\n const info=pb1585DiscountInfo(customer),[editing,setEditing]=x.useState(false),[value,setValue]=x.useState(String(info?.percent??0)),[busy,setBusy]=x.useState(false),[error,setError]=x.useState(\"\");\n x.useEffect(()=>{if(!editing)setValue(String(info?.percent??0))},[customer.id,info?.percent,editing]);\n const start=()=>{if(!info)return;setValue(String(info.percent));setError(\"\");setEditing(true)};\n const save=async()=>{if(busy||!info)return;const normalized=String(value).trim().replace(/[۰-۹]/g,d=>String(\"۰۱۲۳۴۵۶۷۸۹\".indexOf(d))).replace(/[٠-٩]/g,d=>String(\"٠١٢٣٤٥٦٧٨٩\".indexOf(d))).replace(\"٫\",\".\");\n  if(!/^\\d{1,3}(?:\\.\\d{1,2})?$/.test(normalized)||!Number.isFinite(Number(normalized))||Number(normalized)<0||Number(normalized)>100){setError(\"درصد باید بین ۰ تا ۱۰۰ و حداکثر دو رقم اعشار باشد.\");return}\n  const percent=Number(normalized),enable=percent>0;\n  if(percent===info.percent&&enable===info.enabled){setEditing(false);setError(\"\");return}\n  if(enable&&!confirm(\"تغییر درصد تخفیف می‌تواند موجب ثبت سند تخفیف خودکار برای فاکتورهای مشمول شود. ذخیره شود؟\"))return;\n  setBusy(true);setError(\"\");\n  try{\n   const saved=await Me(\"/api/lab/finance/customer-settings\",{method:\"PUT\",body:JSON.stringify({customerId:customer.id,discountEnabled:enable,discountPercent:percent,discountEveryInvoices:info.every})});\n   if(!saved?.settings||Math.abs(Number(saved.settings.discount_percent)-percent)>.00001||Boolean(saved.settings.discount_enabled)!==enable)throw Error(\"مقدار ثبت‌شده از سرور تأیید نشد.\");\n   setEditing(false);\n   try{await onSaved?.()}catch(refreshError){console.warn(\"[R1610] discount refresh\",refreshError)}\n   if(Number(saved.appliedDiscounts)>0)alert(String(saved.appliedDiscounts)+\" سند تخفیف خودکار ثبت شد.\");\n  }catch(err){setError(err?.data?.message||err?.message||\"ذخیره تخفیف انجام نشد؛ دوباره تلاش کنید.\")}\n  finally{setBusy(false)}\n };\n return e.jsxs(\"div\",{className:\"pb1585Discount\",children:[\n  editing?e.jsxs(\"div\",{className:\"pb1585DiscountForm\",children:[\n    e.jsx(\"input\",{type:\"number\",min:0,max:100,step:.01,inputMode:\"decimal\",value,onChange:ev=>setValue(ev.target.value),disabled:busy,\"aria-label\":\"درصد تخفیف \"+(customer.name||\"عکاس\"),onKeyDown:ev=>{if(ev.key===\"Enter\"){ev.preventDefault();void save()}if(ev.key===\"Escape\"&&!busy)setEditing(false)}}),\n    e.jsx(\"button\",{type:\"button\",disabled:busy,onClick:save,children:busy?\"در حال ثبت…\":\"ذخیره\"}),\n    e.jsx(\"button\",{type:\"button\",disabled:busy,onClick:()=>{setEditing(false);setError(\"\")},children:\"لغو\"})\n  ]}):e.jsxs(\"button\",{type:\"button\",className:\"pb1585DiscountEdit\",disabled:!info,onClick:start,title:\"ویرایش تخفیف همین عکاسی\",children:[e.jsx(\"strong\",{children:info?V(info.percent)+\"٪\":\"—\"}),e.jsx(\"span\",{\"aria-hidden\":\"true\",children:\"✎\"})]}),\n  e.jsx(\"small\",{children:!info?\"هنوز دریافت نشده\":!info.configured?\"تعریف نشده\":info.enabled?\"هر \"+V(info.every)+\" فاکتور\":\"غیرفعال\"}),\n  error&&e.jsx(\"small\",{className:\"pb1585DiscountError\",role:\"alert\",children:error})\n ]})\n}\n";
const roots=['dist/web','dist/web/lab-desktop-ui'],bundle='assets/index-UIRefine-v655-r84.js';
const only=(s,old,next,label)=>{if(s.split(old).length!==2)throw Error('R1610 '+label+' missing or ambiguous');return s.replace(old,next)};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const root of roots){
 const asset=root+'/'+bundle;
 let source=fs.readFileSync(asset,'utf8');
 if(!source.includes('/* R1610 inline finance discount */')){
  const start=source.indexOf('function PB1585Discount('),end=source.indexOf('function PB1585CopyLocation(',start);
  if(start<0||end<=start)throw Error('R1610 photographer discount component not found: '+root);
  source=source.slice(0,start)+replacement+source.slice(end);
  source=only(source,'e.jsx(PB1585Discount,{customer})','e.jsx(PB1585Discount,{customer,onSaved})','inline discount props');
  source=only(source,"['25%','11%','16%','14%','8%','26%']","['27%','12%','17%','14%','9%','21%']",'photographer column widths');
  source+='\n/* R1610 inline finance discount */\n';
  fs.writeFileSync(asset,source);
 }
 execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
 const header=root+'/photobridge-r1147-lab-admin-header.js';
 let h=fs.readFileSync(header,'utf8');
 if(!h.includes('/* R1610 no archive second header */')){
  h=only(h,"function secondary(h){\n let row=h.parentElement.querySelector(':scope>.pb1148SecondaryHeader');",
  "function secondary(h){\n let row=h.parentElement.querySelector(':scope>.pb1148SecondaryHeader');\n /* R1610 no archive second header */\n if(/^\\/lab\\/archive(?:\\/|$)/.test(location.pathname)||h.querySelector('.labArchiveHeaderBtn.active')){\n  row?.remove();h.parentElement.querySelector(':scope>.pb1175HeaderFade')?.remove();h.parentElement.classList.remove('pb1148HasSecondary');\n  h.parentElement.querySelectorAll('.pb1148SecondarySource').forEach(el=>el.classList.remove('pb1148SecondarySource'));return;\n }",'archive header');
  fs.writeFileSync(header,h);
 }
 execFileSync(process.execPath,['--check',header],{stdio:'inherit'});
 const files=['photobridge-r1610-lab-ux.js','photobridge-r1610-lab-ux.css'];
 fs.copyFileSync('scripts/r1610-lab-ux.js',root+'/'+files[0]);
 fs.copyFileSync('scripts/r1610-lab-ux.css',root+'/'+files[1]);
 const html=root+'/index.html';let page=fs.readFileSync(html,'utf8');
 if(!page.includes('/'+files[0]+'?v=r1610')){
  page=page.replace('</head>','<link rel="stylesheet" href="/'+files[1]+'?v=r1610"><script defer src="/'+files[0]+'?v=r1610"></script>\n</head>');
  fs.writeFileSync(html,page);
 }
 execFileSync(process.execPath,['--check',root+'/'+files[0]],{stdio:'inherit'});
 if(root.endsWith('/lab-desktop-ui')){
  const file=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const name of [bundle,'index.html','photobridge-r1147-lab-admin-header.js',...files]){
   let item=manifest.files.find(row=>row.name===name);
   if(!item){item={name,url:'/lab-desktop-ui/'+name};manifest.files.push(item)}
   item.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  manifest.build=hash(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(file,JSON.stringify(manifest));
 }
}
console.log('[R1610] Archive/online cleanup, editable customer discount, aligned headers and in-circle status loader enabled for site and Windows Lab');
