'use strict';const fs=require('node:fs'),path=require('node:path');
function integrate(root,repo=path.resolve(__dirname,'..')){
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1471 native anchor changed');return s.replace(a,b)};
 for(const name of ['update-trust.cjs','app-update.cjs','app-update-main.cjs','create-update-release.cjs'])fs.copyFileSync(path.join(repo,'apps/lab-desktop',name),path.join(root,name));
 const file=path.join(root,'main.cjs');let main=fs.readFileSync(file,'utf8');
 if(!main.includes('/* R1471 app updater */')){
  main=once(main,'let applyingUi=null;','let applyingUi=null;let programUpdates=null;');
  const start=main.indexOf(" try{const {autoUpdater}=require('electron-updater');"),end=main.indexOf('\n',start);if(start<0||end<start)throw Error('R1471 old updater missing');
  main=main.slice(0,start)+` /* R1471 app updater */programUpdates=require('./app-update-main.cjs').installAppUpdates({app,dialog,Notification,store,request,getWindow:()=>win,show,canInstall:async()=>{if(nativeStorage.writers.size||nativeStorage.selection||sync.flight)return false;return await win.webContents.executeJavaScript(${JSON.stringify("!document.querySelector('dialog[open],form[data-busy=\"1\"]')")});},beforeQuit:async()=>{quitting=true;await sync.pause();}});void programUpdates.check();`+main.slice(end);
  main=once(main,"{label:'تنظیم صدای اعلان سفارش'", "{label:'به‌روزرسانی برنامه',click:()=>void programUpdates?.check(true)},{label:'تنظیم صدای اعلان سفارش'");
  main=once(main,'nativeAlerts.start();sync.resume();','nativeAlerts.start();void programUpdates?.check();sync.resume();');
  fs.writeFileSync(file,main);
 }
 for(const name of ['package.json','package-lock.json']){const f=path.join(root,name),p=JSON.parse(fs.readFileSync(f));p.version='1.0.32';if(name==='package.json'){for(const script of ['dist','dist:unsigned'])if(!p.scripts[script].includes('create-update-release.cjs'))p.scripts[script]+=' && node create-update-release.cjs';if(!p.build.files.includes('!**/.publisher/**'))p.build.files.push('!**/.publisher/**');}if(p.packages?.[''])p.packages[''].version=p.version;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');}
 for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd']){const f=path.join(root,name);let text=fs.readFileSync(f,'utf8').replace(/1\.0\.31/g,'1.0.32');if(!text.includes('node create-update-release.cjs'))text=once(text,'echo SUCCESS:', 'node create-update-release.cjs\nif errorlevel 1 goto :failed\necho SUCCESS:');fs.writeFileSync(f,text);}
 const tests=path.join(root,'test/automatic-ui.test.cjs');if(fs.existsSync(tests))fs.writeFileSync(tests,fs.readFileSync(tests,'utf8').replace(/1\.0\.31/g,'1.0.32'));
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));module.exports={integrate};
