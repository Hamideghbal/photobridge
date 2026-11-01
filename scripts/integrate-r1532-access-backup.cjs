'use strict';
// Applies after the up-to-date native source modules have been restored to apps/lab-desktop.
const fs=require('node:fs'),path=require('node:path');
function integrate(root=path.resolve('apps/lab-desktop'),repo=path.resolve(__dirname,'..')){
 const original=path.join(root,'main.cjs');
 if(!fs.existsSync(original))throw Error('native_lab_source_missing');
 let main=fs.readFileSync(original,'utf8');
 if(main.includes('/* PB1532 integrated Access backup */'))return false;
 const oldBackup="async function makeBackup(){const folder=path.join(dir,'backups');fs.mkdirSync(folder,{recursive:true});await backup(store.db,path.join(folder,'lab-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite'));const files=fs.readdirSync(folder).sort();for(const name of files.slice(0,-14))fs.unlinkSync(path.join(folder,name))}";
 if(main.split(oldBackup).length!==2)throw Error('native_backup_hook_changed');
 const patched=`/* PB1532 integrated Access backup */async function makeBackup(manual=false){
   const folder=path.join(dir,'backups');
   fs.mkdirSync(folder,{recursive:true});
   const stamp=new Date().toISOString().replace(/[:.]/g,'-');
   const sqlitePath=path.join(folder,'lab-'+stamp+'.sqlite');
   await backup(store.db,sqlitePath);
   let viewer=null;
   try{
    viewer=await require('./finance-backup.cjs').writeFinanceBackup({
      store,request,folder,stamp,sourceScript:path.join(__dirname,'BuildFinancialBackup.vbs'),
      log:message=>console.warn('[Finance Access]',message)
    });
   }catch(error){
    viewer={status:'finance_export_failed'};
    console.warn('[Finance Access] Financial export was not completed; SQLite backup preserved.',String(error?.message||error));
   }
   const sqliteFiles=fs.readdirSync(folder).filter(name=>/^lab-\\d{4}-\\d{2}-\\d{2}T[\\d-]+Z\\.sqlite$/.test(name)).sort();
   for(const name of sqliteFiles.slice(0,-14)){
    fs.rmSync(path.join(folder,name),{force:true});
    fs.rmSync(path.join(folder,name.slice(0,-7)+'-access'),{recursive:true,force:true});
   }
   if(manual){
    const result=viewer?.status==='access_ready'?'فایل PhotoBridge_Finance.accdb با سه فرم فاکتورها، دریافتی‌ها و حساب معین ساخته شد.':viewer?.status==='access_requires_microsoft_access'?'فایل‌های مالی و سازنده فرم‌ها ذخیره شد؛ برای فایل accdb باید Microsoft Access نصب باشد.':viewer?.status==='not_signed_in'?'بکاپ محلی SQLite ساخته شد؛ برای خروجی مالی ابتدا وارد حساب لابراتوار شوید.':'بکاپ SQLite ساخته شد، اما خروجی مالی کامل نشد؛ اتصال و لاگ برنامه را بررسی کنید.';
    await dialog.showMessageBox(win,{type:'info',title:'پشتیبان‌گیری PhotoBridge',message:result,detail:'مسیر: '+folder,buttons:['بستن','باز کردن پوشه بکاپ'],defaultId:1,cancelId:0}).then(answer=>{if(answer.response===1)return shell.openPath(folder)});
   }
   return{sqlitePath,viewer};
 }`;
 main=main.replace(oldBackup,patched);
 const menuAnchor="{label:'به‌روزرسانی برنامه',click:()=>void programUpdates?.check(true)}";
 if(main.split(menuAnchor).length!==2)throw Error('native_tray_menu_hook_changed');
 main=main.replace(menuAnchor,"{label:'ساخت بکاپ همراه فرم‌های Access',click:()=>void makeBackup(true).catch(error=>dialog.showErrorBox('PhotoBridge',String(error.message||error)))}, "+menuAnchor);
 const additions=['finance-backup.cjs','BuildFinancialBackup.vbs'];
 for(const file of additions){
  fs.copyFileSync(path.join(repo,'apps/lab-desktop',file),path.join(root,file));
 }
 const packageFile=path.join(root,'package.json');
 if(fs.existsSync(packageFile)){
  const pkg=JSON.parse(fs.readFileSync(packageFile,'utf8'));
  if(Array.isArray(pkg.build?.files)){
   for(const name of ['finance-backup.cjs','BuildFinancialBackup.vbs']){
    if(!pkg.build.files.some(entry=>entry===name||entry==='**/'+name))
      pkg.build.files.push(name);
   }
   fs.writeFileSync(packageFile,JSON.stringify(pkg,null,2)+'\n');
  }
 }
 fs.writeFileSync(original,main);
 return true;
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));
module.exports={integrate};
