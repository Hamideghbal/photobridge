import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1471 changed anchor: '+a.slice(0,85));return s.replace(a,b)};
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1471 app update feed */')){
 s="import {cleanUpdate,validateLabUpdate} from './lab-app-update.js';\n"+s;
 const a=s.indexOf('function cleanLabDesktopRelease('),b=s.indexOf('async function labDesktopReleaseSetting()',a);if(a<0||b<a)throw Error('R1471 cleaner missing');let part=s.slice(a,b);part=once(part,'        version,','        autoUpdate: cleanUpdate(x.autoUpdate,{version,name,bytes:Math.max(0,Number(x.bytes||0)||0)}),\n        version,');s=s.slice(0,a)+part+s.slice(b);
 const c=s.indexOf("if (req.method === 'POST' && url.pathname === '/api/admin/lab-desktop-release/upload/complete')"),d=s.indexOf("if (req.method === 'GET' && url.pathname === '/api/admin/video-guides')",c);if(c<0||d<c)throw Error('R1471 complete missing');part=s.slice(c,d);
 part=once(part,'        const old = await labDesktopReleaseSetting().catch(() => null);',"        let autoUpdate=null;\n        if(b.updateManifest){try{autoUpdate=await validateLabUpdate(b.updateManifest,{version:item.version,name:item.name,bytes:actual,objectKey:item.key},key=>s3.send(new GetObjectCommand({Bucket:S3_BUCKET,Key:key})));}catch{return sendJson(res,400,{error:'invalid_update_manifest_or_installer'});}}\n        const old = await labDesktopReleaseSetting().catch(() => null);");
 part=once(part,'{ version: item.version, name: item.name, objectKey: item.key,','{ autoUpdate, version: item.version, name: item.name, objectKey: item.key,');s=s.slice(0,c)+part+s.slice(d);
 s=once(s,"|| url.pathname === '/api/lab/desktop-installer/status')", "|| url.pathname === '/api/lab/desktop-installer/status' || url.pathname === '/api/lab/desktop-installer/update')");
 s=once(s,"            let release = await labDesktopReleaseSetting().catch(() => null), downloadUrl = null, source = 'unavailable';", "            let release = await labDesktopReleaseSetting().catch(() => null), downloadUrl = null, source = 'unavailable';\n            if(url.pathname==='/api/lab/desktop-installer/update')return sendJson(res,200,{update:release?.autoUpdate||null});");
 fs.writeFileSync(file,s+'\n/* PB1471 app update feed */\n');
}
const uiFile='dist/web/photobridge-admin-lab-desktop-release-v72.js';let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1471 update release upload */')){
 ui=once(ui,'<label>شماره نسخه<input data-version', '<label>فایل تأیید آپدیت (.json)<input data-update-manifest type="file" accept=".json,application/json"></label><label>شماره نسخه<input data-version');
 ui=once(ui,"      const file = $('[data-file]', box)","      const updateFile=$('[data-update-manifest]',box);\n      updateFile.onchange=async()=>{try{const value=JSON.parse(await updateFile.files[0].text());$('[data-version]',box).value=value.version;setMessage(box,'فایل تأیید آپدیت انتخاب شد؛ فایل EXE همین نسخه را هم انتخاب کنید.');}catch{setMessage(box,'فایل تأیید آپدیت معتبر نیست.','err');}};\n      const file = $('[data-file]', box)");
 ui=once(ui,"        btn.disabled = file.disabled = ver.disabled = true;", "        let updateManifest=null;try{if(updateFile.files?.[0]){if(updateFile.files[0].size>16384)throw Error();updateManifest=JSON.parse(await updateFile.files[0].text());if(updateManifest.version!==v||updateManifest.size!==f.size)throw Error();}}catch{return setMessage(box,'فایل تأیید با نسخه یا حجم EXE مطابقت ندارد.','err');}\n        btn.disabled = file.disabled = ver.disabled = updateFile.disabled = true;");
 ui=once(ui,'JSON.stringify({ uploadId: start.uploadId })','JSON.stringify({ uploadId: start.uploadId,updateManifest })');
 ui=once(ui,"setMessage(box, 'نسخه جدید برنامه لابراتوار فعال شد.', 'ok');", "setMessage(box,updateManifest?'نسخهٔ جدید برای دانلود و به‌روزرسانی داخل برنامه منتشر شد.':'فایل نصب منتشر شد؛ برای آپدیت خودکار، فایل تأیید JSON خروجی ساخت را هم بارگذاری کنید.','ok');");
 ui=once(ui,'btn.disabled = file.disabled = ver.disabled = false;','btn.disabled = file.disabled = ver.disabled = updateFile.disabled = false;');
 ui=ui.replace('نسخه جدید لابراتوار روی همان معماری آفلاین برنامه فروشگاه است. فایل EXE را از همین‌جا منتشر کن؛ نسخه قدیمی دیگر استفاده نمی‌شود.','فایل EXE و فایل تأیید JSON همان نسخه را از پوشهٔ release انتخاب کنید؛ برنامهٔ مشتری نسخهٔ جدید را دریافت می‌کند.');
 fs.writeFileSync(uiFile,ui+'\n/* PB1471 update release upload */\n');
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let compiled=fs.readFileSync(bundle,'utf8');
if(!compiled.includes('/* PB1471 native release admin */')){
 const start=compiled.indexOf('async function PB1369UploadInstaller('),end=compiled.indexOf('function PB1373DomainPanel(',start);if(start<0||end<start)throw Error('R1471 actual admin component missing');let block=compiled.slice(start,end);
 block=once(block,'PB1369UploadInstaller(file,version,progress){','PB1369UploadInstaller(file,version,progress,updateManifest=null){');
 block=once(block," const init=await Me('/api/admin/lab-desktop-release/upload'", " if(updateManifest&&(!/\\.exe$/i.test(file.name)||updateManifest.version!==version||updateManifest.size!==file.size))throw Error('فایل تأیید با EXE و شمارهٔ نسخه مطابقت ندارد.');\n const init=await Me('/api/admin/lab-desktop-release/upload'");
 block=once(block,'JSON.stringify({uploadId:init.uploadId})','JSON.stringify({uploadId:init.uploadId,updateManifest})');
 block=once(block,"[done,setDone]=x.useState(false);","[done,setDone]=x.useState(false),[updateManifest,setUpdateManifest]=x.useState(null);");
 block=once(block,'PB1369UploadInstaller(file,version.trim(),setPercent)','PB1369UploadInstaller(file,version.trim(),setPercent,updateManifest)');
 block=once(block,"busy&&e.jsxs('div',{role:'status'", "e.jsxs('label',{children:['فایل تأیید آپدیت خودکار (JSON خروجی ساخت)',e.jsx('input',{type:'file',accept:'.json,application/json',disabled:busy,onChange:async event=>{setDone(false);setUpdateManifest(null);try{const f=event.target.files?.[0];if(!f)return;if(f.size>16384)throw Error();const m=JSON.parse(await f.text());if(m.protocol!==1||typeof m.signature!=='string'||typeof m.sha256!=='string')throw Error();setUpdateManifest(m);setVersion(m.version);setError('');}catch{setError('فایل تأیید آپدیت معتبر نیست.');}}})]}),busy&&e.jsxs('div',{role:'status'");
 block=once(block,"children:'نسخهٔ جدید ثبت شد و برای دانلود آماده است.'", "children:updateManifest?'نسخهٔ جدید برای دانلود و آپدیت داخل برنامه منتشر شد.':'فایل نصب ثبت شد؛ بدون JSON، آپدیت خودکار فعال نمی‌شود.'");
 compiled=compiled.slice(0,start)+block+compiled.slice(end)+'\n/* PB1471 native release admin */\n';fs.writeFileSync(bundle,compiled);
}
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(p,'utf8');html=html.replace(/(photobridge-admin-lab-desktop-release-v72\.js\?[^"'\s]*)/g,url=>url.includes('appUpdates=r1471')?url:url+'&appUpdates=r1471');fs.writeFileSync(p,html);}
for(const p of [file,uiFile,bundle,'dist/api/lab-app-update.js'])execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
