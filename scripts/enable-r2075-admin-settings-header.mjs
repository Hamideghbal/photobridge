// R2075 — keep the administrator's settings navigation present across settings routes.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const root='dist/web/',name='photobridge-r1147-lab-admin-header.js',file=root+name;
let js=fs.readFileSync(file,'utf8');
const marker='/* PB2075 admin preview settings source */';
if(!js.includes(marker)){
 const anchor='function secondary(h){';
 if(js.split(anchor).length!==2)throw Error('[R2075] missing Lab secondary owner');
 js=js.replace(anchor,"/* PB2075 admin preview settings source */\nfunction pb2075SettingsSource(h,native){\n const root=h.closest('.labRoleWorkspace'),old=root?.querySelector('.pb2075SettingsFallback');\n const preview=!!root&&document.body.classList.contains('pbAdminImpersonating')&&/^\\/lab\\/settings(?:\\/|$)/.test(location.pathname);\n if(root&&root.classList.contains('pb2075SettingsActive')!==preview)root.classList.toggle('pb2075SettingsActive',preview);\n if(!preview||native?.querySelector(':scope>button')){old?.remove();return native;}\n const section=location.pathname.split('/')[3]||'general';\n const group=categories.find(item=>item[2].includes(section));\n // Preserve actual category/route permissions; don't add unrelated settings\n // to unknown sections. The route's own authorization remains authoritative.\n if(!group){old?.remove();return native;}\n const labels={general:'عمومی و اعلان‌ها',hours:'ساعت کاری',site:'سایت اختصاصی',sms:'پیامک مشتریان',windowsAlert:'هشدار ویندوز',snappbox:'اسنپ و ارسال',customers:'عکاس‌ها',walkin:'مشتری آزاد',prices:'تعرفه چاپ و سایز',album:'تنظیمات آلبوم',payment:'تنظیمات پرداخت',wallet:'کیف پول',subscription:'اشتراک',local:'مسیر ذخیره روی هارد',backup:'پشتیبان اطلاعات سایت',automation:'دانلود و چاپ خودکار'};\n const keys=group[2],signature=keys.join('|');\n let source=old;\n if(!source){source=document.createElement('nav');source.className='pb2075SettingsFallback';source.hidden=true;root.append(source);}\n if(source.dataset.group!==signature){\n  source.replaceChildren();\n  for(const key of keys){\n   const button=document.createElement('button');button.type='button';button.dataset.section=key;button.textContent=labels[key]||group[0];\n   button.onclick=()=>navigate(key==='general'?'/lab/settings':key==='wallet'?'/lab/wallet':'/lab/settings/'+key);\n   source.append(button);\n  }\n  source.dataset.group=signature;\n }\n for(const button of source.children){const active=button.dataset.section===section;if(button.classList.contains('active')!==active)button.classList.toggle('active',active);}\n return source;\n}\n"+anchor);
 const source="document.querySelector('.labSettingsSectionTabs')";
 if(js.split(source).length!==2)throw Error('[R2075] expected one original settings source');
 js=js.replace(source,"pb2075SettingsSource(h,"+source+")");
 // The settings source must survive transient tab unmounts and account/route changes.
 fs.writeFileSync(file,js);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const htmlFile=root+'index.html';let html=fs.readFileSync(htmlFile,'utf8');
const urlRe=/photobridge-r1147-lab-admin-header\.js\?[^"'<>\s]*/g;
if([...html.matchAll(urlRe)].length!==1)throw Error('[R2075] expected one lab header script');
html=html.replace(urlRe,url=>url.replace(/&adminSettings=r\d+/g,'')+'&adminSettings=r2075');
const cssId='pb2075AdminSettingsHeader';
if(!html.includes('id="'+cssId+'"')){
 const css='@media(min-width:821px) and (hover:hover) and (pointer:fine){html body.pbAdminImpersonating #root .labRoleWorkspace .pb2075SettingsFallback{display:none!important}html body.pbAdminImpersonating #root .labRoleWorkspace.pb2075SettingsActive .pb1148SecondaryHeader:not(.pb1174QueueNav){visibility:visible!important;opacity:1!important;pointer-events:auto!important}html body.pbAdminImpersonating #root .labRoleWorkspace.pb2075SettingsActive:not(.pb1425PromotedSecond) .pb1148SecondaryHeader{display:flex!important}}';
 html=html.replace('</head>','<style id="'+cssId+'">'+css+'</style></head>');
}
fs.writeFileSync(htmlFile,html);
for(const [ext,encode,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(file+ext)){const bytes=fs.readFileSync(file);fs.writeFileSync(file+ext,encode(bytes));if(!decode(fs.readFileSync(file+ext)).equals(bytes))throw Error('[R2075] stale admin header '+ext)}
console.log('[R2075] administrator preview settings tabs preserved');
