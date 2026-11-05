'use strict';const fs=require('node:fs'),path=require('node:path');
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1629 native anchor '+a.slice(0,80));return s.replace(a,b)};
function integrate(root,source=path.resolve(__dirname,'../apps/lab-desktop')){
 for(const name of ['ui-update-dialog.cjs','unified-updates.cjs'])fs.copyFileSync(path.join(source,name),path.join(root,name));
 let file=path.join(root,'main.cjs'),s=fs.readFileSync(file,'utf8');if(!s.includes('retryFailedBuild,onProgress')){
 s=once(s,'async function updateUi(startup=false){','async function updateUi(startup=false,retryFailedBuild=false,onProgress=()=>{}){');s=once(s,'bundled,acceptRoot:validateNativeUi,directory:','bundled,acceptRoot:validateNativeUi,retryFailedBuild,onProgress,directory:');
 s=once(s,'checkUi:()=>updateUi(true),uiBusy:()=>uiChecking,',"checkUi:onProgress=>updateUi(true,true,onProgress),uiBusy:()=>uiChecking,waitForUi:async()=>{const deadline=Date.now()+180000;while(uiChecking){if(Date.now()>deadline)throw Error('ui_update_timeout');await new Promise(resolve=>setTimeout(resolve,150))}},isOnline:()=>net.isOnline(),progress:state=>updateDialog.progress(state),stopProgress:()=>updateDialog.stopProgress(),");fs.writeFileSync(file,s);}
 file=path.join(root,'ui-update.cjs');s=fs.readFileSync(file,'utf8');if(!s.includes('retryFailedBuild=false')){s=once(s,'onProgress=()=>{},acceptRoot=()=>{}','onProgress=()=>{},acceptRoot=()=>{},retryFailedBuild=false');s=once(s,"if(manifest.build===store.get('uiFailedBuild'))","if(manifest.build===store.get('uiFailedBuild')&&!retryFailedBuild)");fs.writeFileSync(file,s);}
 for(const name of ['package.json','package-lock.json','BUILD-WINDOWS.cmd']){const versionFile=path.join(root,name);if(fs.existsSync(versionFile))fs.writeFileSync(versionFile,fs.readFileSync(versionFile,'utf8').replaceAll('1.0.88','1.0.89'));}
 file=path.join(root,'update-progress.html');if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('سفارش‌ها و مسیرهای ذخیره حفظ می‌شوند.','نسخهٔ فعلی برنامه و تنظیمات حفظ می‌شوند.'));
}
module.exports={integrate};if(require.main===module)integrate(path.resolve(process.argv[2]));
