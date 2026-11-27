// R2095: isolated Store Windows event feed and signed full installer release.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R2095 anchor '+a.slice(0,100));return s.replace(a,()=>b)};
function write(p,s){fs.writeFileSync(p,s);const bytes=fs.readFileSync(p);for(const [ext,encode] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]])if(fs.existsSync(p+ext))fs.writeFileSync(p+ext,encode(bytes))}
export function patchServer(s){
 if(s.includes('/* PB2095 store native */'))return s;
 s="import {ensureStoreNativeEvents,storeNativeNotificationRoute,isCameraStore} from './store-native-events.js';\nimport {cleanStoreUpdate,validateStoreUpdate,sendStoreUpdateFile} from './store-native-update.js';\n/* PB2095 store native */\n"+s;
 const start=s.indexOf('function cleanStoreDesktopRelease('),end=s.indexOf('async function storeDesktopReleaseSetting()',start);
 if(start<0||end<=start)throw Error('R2095 store release cleaner');
 let part=s.slice(start,end);part=once(part,'        version,','        autoUpdate:cleanStoreUpdate(x.autoUpdate,{version,name,bytes:Math.max(0,Number(x.bytes||0)||0)}),\n        version,');s=s.slice(0,start)+part+s.slice(end);
 const a=s.indexOf("if (req.method === 'POST' && url.pathname === '/api/admin/store-desktop-release/upload/complete')"),b=s.indexOf("if (req.method === 'GET' && url.pathname === '/api/admin/lab-desktop-release')",a);
 if(a<0||b<=a)throw Error('R2095 release upload bounds');
 part=s.slice(a,b);
 part=once(part,'        const old = await storeDesktopReleaseSetting().catch(() => null);',"        let autoUpdate=null;\n        if(b.updateManifest){try{autoUpdate=await validateStoreUpdate(b.updateManifest,{version:item.version,name:item.name,bytes:actual,objectKey:item.key},key=>s3Download.send(new GetObjectCommand({Bucket:S3_BUCKET,Key:key})));}catch{return sendJson(res,400,{error:'invalid_store_update_manifest_or_installer'});}}\n        const old = await storeDesktopReleaseSetting().catch(() => null);");
 part=once(part,'{ version: item.version, name: item.name, objectKey: item.key,','{ autoUpdate, version: item.version, name: item.name, objectKey: item.key,');s=s.slice(0,a)+part+s.slice(b);
 const route="    if(req.method==='GET'&&url.pathname==='/api/rental/notifications'){";
 const insert=[
 "    if(await storeNativeNotificationRoute({req,url,res,a,pool,shopFor:equipmentRentalCurrentShop,sendJson,bodyJson}))return;",
 "    if(req.method==='GET'&&['/api/rental/desktop/update','/api/rental/desktop/update/installer'].includes(url.pathname)){",
 "      const shop=await equipmentRentalCurrentShop(a);if(!isCameraStore(shop)||a?.adminStorePreview||a?.rentalRole!=='shop_admin')return sendJson(res,403,{error:'forbidden'});",
 "      const q=await pool.query(\"SELECT 1 FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND user_id=$2 AND role='shop_admin' AND active=true LIMIT 1\",[shop.id,a.userId]);if(!q.rowCount)return sendJson(res,403,{error:'forbidden'});",
 "      const release=await storeDesktopReleaseSetting();if(url.pathname.endsWith('/update'))return sendJson(res,200,{update:release?.autoUpdate||null});",
 "      if(!storageConfigured||!await sendStoreUpdateFile(res,release,key=>s3Download.send(new GetObjectCommand({Bucket:S3_BUCKET,Key:key}))))return sendJson(res,503,{error:'desktop_release_unavailable'});return;",
 "    }"
 ].join('\n');
 s=once(s,route,insert+'\n'+route);
 s=once(s,'    await seedAdmin();','    await seedAdmin();\n    await ensureEquipmentRentalV628Schema();await ensureEquipmentRentalV654Schema();await ensureStoreNativeEvents(pool);');
 return s;
}
export function patchAdmin(s){
 if(s.includes('PB2095 store signed release'))return s;
 s=once(s,'<label class="pbR62DesktopField"><span>شماره نسخه</span>','<label class="pbR62DesktopField"><span>فایل تأیید آپدیت (JSON)</span><input class="pbR62DesktopFile" data-update-manifest type="file" accept=".json,application/json"></label><label class="pbR62DesktopField"><span>شماره نسخه</span>');
 s=once(s,'grid-template-columns:minmax(210px,1fr) 145px auto','grid-template-columns:minmax(180px,1fr) minmax(180px,1fr) 145px auto');
 s=once(s,"      fileInput?.addEventListener('change'", "      const updateInput=$('[data-update-manifest]',box);updateInput.addEventListener('change',async()=>{try{const f=updateInput.files?.[0];if(!f)return;if(f.size>16384)throw Error();const m=JSON.parse(await f.text());if(m.channel!=='store'||m.protocol!==1)throw Error();verInput.value=m.version;setMessage(box,'فایل تأیید انتخاب شد؛ EXE همان نسخه را انتخاب کنید.')}catch{setMessage(box,'فایل تأیید فروشگاه معتبر نیست.','err')}});\n      fileInput?.addEventListener('change'");
 s=once(s,'        btn.disabled=true;fileInput.disabled=true;verInput.disabled=true;', "        let updateManifest=null;try{const f=updateInput.files?.[0];if(f){if(f.size>16384)throw Error();updateManifest=JSON.parse(await f.text());if(updateManifest.channel!=='store'||updateManifest.protocol!==1||updateManifest.version!==version||updateManifest.size!==file.size)throw Error();}}catch{return setMessage(box,'فایل JSON با نسخه یا حجم EXE فروشگاه مطابقت ندارد.','err')}\n        btn.disabled=true;fileInput.disabled=true;verInput.disabled=true;updateInput.disabled=true;");
 s=once(s,'JSON.stringify({uploadId:start.uploadId})','JSON.stringify({uploadId:start.uploadId,updateManifest})');
 s=once(s,"setMessage(box,'برنامه با موفقیت بارگذاری شد و از این لحظه نسخه فعال سایت است.','ok');","setMessage(box,updateManifest?'نسخه نصبی تأیید شد و برای به‌روزرسانی داخل برنامه فعال است.':'فقط فایل نصب منتشر شد؛ برای به‌روزرسانی داخل برنامه JSON امضاشده لازم است.','ok');");
 s=once(s,"verInput.disabled=false;prog.classList","verInput.disabled=false;updateInput.disabled=false;prog.classList");
 s=s.replace('برای نسخه جدید فقط فایل EXE و شماره نسخه را انتخاب کن. فایل قبلی بعد از ثبت موفق نسخه جدید به‌صورت خودکار جایگزین می‌شود.','برای آپدیت کامل داخل برنامه، EXE و JSON امضاشده همان نسخه را انتخاب کنید.');
 return s+'\n/* PB2095 store signed release */\n';
}
const server='dist/api/server.js',admin='dist/web/photobridge-admin-desktop-release-v62.js';
export function run(){write(server,patchServer(fs.readFileSync(server,'utf8')));write(admin,patchAdmin(fs.readFileSync(admin,'utf8')));for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){const html=fs.readFileSync(p,'utf8');write(p,html.replace(/photobridge-admin-desktop-release-v62\.js\?[^"'<> \r\n]+/g,u=>u.replace(/&storeUpdate=r\d+/g,'')+'&storeUpdate=r2095'))}for(const p of [server,admin,'dist/api/store-native-events.js','dist/api/store-native-update.js'])execFileSync(process.execPath,['--check',p],{stdio:'inherit'})}
if(process.argv[1]&&process.argv[1].endsWith('enable-r2095-store-native.mjs'))run();
