'use strict';
// Run after restoring the editable native Store source, before packaging.
// Does not touch the Lab or frame/chassis UI.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R2095 native anchor '+a.slice(0,90));return s.replace(a,()=>b)};
function patchMain(s){
 if(s.includes('/* R2095 Store native window and updates */'))return s;
 s=once(s,"const {app,BrowserWindow,Tray,Menu,Notification,net,safeStorage,shell,dialog}=require('electron');","const {app,BrowserWindow,Tray,Menu,Notification,net,safeStorage,shell,dialog,ipcMain,screen}=require('electron');");
 s=once(s,"if(!app.requestSingleInstanceLock())app.quit();","const storeTestProfile=process.env.PB_STORE_TEST_PROFILE==='1';if(storeTestProfile){const dir=path.join(app.getPath('appData'),'PhotoBridge Store R2095 Test');fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);}\nif(!app.requestSingleInstanceLock())app.quit();");
 s=once(s,"app.setLoginItemSettings({openAtLogin:true,args:['--background']});","if(!storeTestProfile)app.setLoginItemSettings({openAtLogin:true,args:['--background']});");
 const anchor=" sync=new Sync({store,request,isOnline:()=>net.isOnline(),notify:b=>{";
 s=once(s,anchor,[
 " /* R2095 Store native window and updates */",
 " const cameraAccount=()=>{const auth=store.get('auth'),shopId=store.get('shopId'),userId=auth?.user?.id||auth?.userId||auth?.id;if(!auth||!shopId||!userId)return null;let shop;try{shop=store.overview()?.shop}catch{return null}if(!shop||String(shop.id)!==String(shopId)||!['equipment_rental','equipment_sale','equipment_rental_sale'].includes(String(shop.business_category||'equipment_rental_sale')))return null;return String(shopId)+':'+String(userId)+':'+base};",
 " let programUpdates=null,legacyUpdater=null,storeAlerts=null,alertWindow=null;",
 " const refreshLegacy=()=>{if(!legacyUpdater)return;const frame=store.get('auth')&&!cameraAccount()&&['frame','chassis','frame_chassis'].includes(String(store.overview()?.shop?.business_category||''));legacyUpdater.autoInstallOnAppQuit=Boolean(frame);if(frame)void legacyUpdater.checkForUpdates().catch(()=>{})};",
 anchor+"if(cameraAccount())return;"
 ].join('\n'));
 s=once(s,"sync.report=null;sync.online=true;sync.resume();await sync.run();","sync.report=null;sync.online=true;sync.resume();await sync.run();storeAlerts?.start();void programUpdates?.check(false);refreshLegacy();");
 s=once(s,"onLogout:async()=>{authEpoch++;","onLogout:async()=>{storeAlerts?.stop();if(legacyUpdater)legacyUpdater.autoInstallOnAppQuit=false;authEpoch++;");
 const menu="{label:'پشتیبان‌گیری از اطلاعات',click:()=>void makeBackup()}";
 s=once(s,menu,"{label:'اعلان‌ها و تنظیم صدای اعلان',click:()=>{if(cameraAccount())alertWindow?.showSettings()}},{label:'به‌روزرسانی برنامه',click:()=>{if(cameraAccount())void programUpdates?.check(true);else refreshLegacy()}},{label:'به‌روزرسانی سریع ظاهر',click:()=>{if(cameraAccount())void programUpdates?.checkUiOnly();else void updateUi()} },"+menu);
 const legacyStart=s.indexOf(" // Native updates are installed only when the release is signed;");
 const legacyEnd=s.indexOf(" async function applyUi(",legacyStart);
 if(legacyStart<0||legacyEnd<=legacyStart)throw Error('R2095 existing native updater bounds');
 const init=[
 " const {AlertWindow}=require('./alert-window.cjs'),{StoreAlerts}=require('./store-alerts.cjs');",
 " alertWindow=new AlertWindow({BrowserWindow,ipcMain,store,getAccount:cameraAccount,getWorkArea:()=>screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea,open:async items=>{const account=cameraAccount();await show();if(!account||cameraAccount()!==account)return;const targets=[...new Set(items.map(x=>x.target))];if(targets.length===1&&['bookings','sales','photographers'].includes(targets[0]))await win.webContents.executeJavaScript('window.selectRentalTab?.('+JSON.stringify(targets[0])+',{reloadExtra:false})').catch(()=>{})}});",
 " storeAlerts=new StoreAlerts({store,request,getAccount:cameraAccount,present:(...args)=>alertWindow.present(...args),dismiss:reason=>{if(reason==='empty'&&alertWindow.settingsOnly&&cameraAccount())return;alertWindow.dismiss()}});",
 " storeAlerts.start();app.on('before-quit',()=>{storeAlerts.stop();alertWindow.destroy()});",
 " const canInstall=async()=>{if(storeTestProfile||!cameraAccount()||sync.flight||uiChecking||printInFlight.size||store.rows().some(r=>['pending','conflict'].includes(r.state)))return false;try{return await win.webContents.executeJavaScript("+JSON.stringify("!Array.from(document.querySelectorAll('dialog[open],[role=\"dialog\"],form[data-busy=\"1\"],[id*=\"Modal\"],[id*=\"modal\"]')).some(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden')&&!/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||'')")+")}catch{return false}};",
 " let installPaused=false;",
 " const recoverInstall=async()=>{if(installPaused){installPaused=false;sync.resume();win.setEnabled(true)}};",
 " const prepareInstall=async()=>{const account=cameraAccount();if(!account||!await canInstall())throw Error('finish_current_work');win.setEnabled(false);installPaused=true;await sync.pause();if(cameraAccount()!==account||!await canInstall())throw Error('finish_current_work');await makeBackup();if(cameraAccount()!==account||store.rows().some(r=>['pending','conflict'].includes(r.state)))throw Error('finish_current_work')};",
 " const checkUi=async()=>{await show();if(!await canInstall()){await dialog.showMessageBox(win,{message:'ابتدا فرم‌ها و عملیات باز را تمام کنید.'});return}await updateUi(true);if(store.get('updateError')){await dialog.showMessageBox(win,{message:'دریافت ظاهر جدید انجام نشد؛ نسخه فعلی حفظ شد.'});return}if(store.get('uiRoot')&&store.get('uiRoot')!==activeUiRoot){if(!await canInstall())return;const answer=await dialog.showMessageBox(win,{message:'ظاهر جدید آماده است. اکنون اعمال شود؟',buttons:['بعداً','اعمال'],defaultId:0,cancelId:0});if(answer.response===1&&await canInstall())await applyUi(false)}else await dialog.showMessageBox(win,{message:'آخرین نسخهٔ ظاهر برنامه نصب است.'})};",
 " programUpdates=require('./store-app-update-main.cjs').installStoreUpdates({app,dialog,store,request,getAccount:cameraAccount,getWindow:()=>win,canInstall,prepareInstall,recoverInstall,quit:async()=>{quitting=true;storeAlerts.stop();app.quit()},checkUi});void programUpdates.check(false);",
 " // Legacy frame/chassis updater remains isolated from camera-equipment accounts.",
 " try{if(!storeTestProfile&&app.isPackaged&&require('./release-config.json').signed){legacyUpdater=require('electron-updater').autoUpdater;legacyUpdater.autoDownload=true;legacyUpdater.autoInstallOnAppQuit=false;legacyUpdater.on('error',e=>store.set('updateError',e.message));legacyUpdater.on('update-downloaded',()=>{if(!cameraAccount()&&store.get('auth'))new Notification({title:'PhotoBridge Store',body:'نسخه جدید آماده است؛ هنگام خروج کامل نصب می‌شود.'}).show()});refreshLegacy();setInterval(refreshLegacy,6*3600000).unref()}}catch(e){store.set('updateError',e.message)}",
 ""
 ].join('\n');
 s=s.slice(0,legacyStart)+init+s.slice(legacyEnd);
 new Function(s);return s;
}
function integrate(root=path.resolve('apps/store-desktop'),version,repo=path.resolve(__dirname,'..')){
 const pkgFile=path.join(root,'package.json'),pkg=JSON.parse(fs.readFileSync(pkgFile,'utf8'));
 if(pkg.name!=='photobridge-store-desktop'||pkg.build?.appId!=='ir.photobridge.store')throw Error('not_verified_store_source');
 const current=pkg.version;version=version||current.split('.').map((x,i)=>i===2?Number(x)+1:x).join('.');
 const newer=(a,b)=>{const aa=a.split('.').map(Number),bb=b.split('.').map(Number);for(let i=0;i<3;i++)if(aa[i]!==bb[i])return aa[i]>bb[i];return false};
 const main=path.join(root,'main.cjs'),source=fs.readFileSync(main,'utf8');
 if(!/^\d+\.\d+\.\d+$/.test(version)||(!source.includes('/* R2095 Store native window and updates */')&&!newer(version,current)))throw Error('new_store_version_required');
 const patched=patchMain(source);
 for(const n of ['store-alerts.cjs','alert-window.cjs','alert-settings.cjs','alert-preload.cjs','alert-renderer.js','alert.html','update-trust.cjs','app-update.cjs','store-app-update-main.cjs','create-update-release.cjs']){
   const from=path.join(repo,'apps/store-desktop',n),to=path.join(root,n);
   if(path.resolve(from)!==path.resolve(to))fs.copyFileSync(from,to);
 }
 fs.mkdirSync(path.join(root,'assets'),{recursive:true});
 fs.copyFileSync(path.join(repo,'dist/web/assets/photobridge-handover-vazirmatn.woff2'),path.join(root,'assets/photobridge-vazirmatn.woff2'));
 fs.writeFileSync(main,patched);
 pkg.version=version;pkg.build.win.artifactName='PhotoBridge-Store-Setup-${version}-${arch}.${ext}';pkg.build.files=[...new Set([...pkg.build.files,'alert-renderer.js','!**/.publisher/**','!**/publisher-key/**','!**/create-update-release.cjs','!**/*private*.pem'])];
 // Private update key is never read by the packaged app. Publish JSON only after the signed build.
 pkg.scripts['release:manifest']='node create-update-release.cjs';
 fs.writeFileSync(pkgFile,JSON.stringify(pkg,null,2)+'\n');
 const lockFile=path.join(root,'package-lock.json'),lock=JSON.parse(fs.readFileSync(lockFile,'utf8'));lock.version=version;if(lock.packages?.[''])lock.packages[''].version=version;fs.writeFileSync(lockFile,JSON.stringify(lock,null,2)+'\n');
 for(const n of ['main.cjs','store-alerts.cjs','app-update.cjs','alert-window.cjs','alert-preload.cjs','store-app-update-main.cjs','create-update-release.cjs'])execFileSync(process.execPath,['--check',path.join(root,n)],{stdio:'inherit'});
 return version;
}
module.exports={integrate,patchMain};
if(require.main===module)console.log('R2095 Store candidate:',integrate(path.resolve(process.argv[2]||'apps/store-desktop'),process.argv[3]));
