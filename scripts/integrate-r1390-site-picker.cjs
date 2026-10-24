'use strict';
const fs=require('node:fs'),path=require('node:path');
function integrate(root,repo=path.resolve(__dirname,'..')){
 for(const [source,target] of [['scripts/r1390-native/site-picker.cjs','site-picker.cjs'],['apps/lab-desktop/configured-storage.cjs','configured-storage.cjs'],['scripts/r1388-native/write-access.cjs','write-access.cjs'],['scripts/r1390-native/test/site-picker.test.cjs','test/site-picker.test.cjs']]){fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});fs.copyFileSync(path.join(repo,source),path.join(root,target));}
 const main=path.join(root,'main.cjs');let s=fs.readFileSync(main,'utf8');if(!s.includes('/* R1390 site picker */')){
 const before="require('./configured-storage.cjs').installConfiguredStorage(nativeStorage);";if(s.split(before).length!==2)throw Error('R1390 storage installation changed');s=s.replace(before,before+"require('./site-picker.cjs').installSitePicker(nativeStorage);/* R1390 site picker */setInterval(()=>{if(store.get('auth'))void nativeStorage.pollSitePicker()},5000).unref();");
 const picker="selectDirectory:()=>dialog.showOpenDialog(win,";if(s.split(picker).length!==2)throw Error('R1390 native picker changed');s=s.replace(picker,"selectDirectory:async()=>{await show();return dialog.showOpenDialog(win,");
 const ending="?.path})});require('./configured-storage.cjs')";if(s.split(ending).length!==2)throw Error('R1390 native picker ending changed');s=s.replace(ending,"?.path})}});require('./configured-storage.cjs')");fs.writeFileSync(main,s);}
 const host=path.join(root,'host.cjs');s=fs.readFileSync(host,'utf8');if(!s.includes("url.pathname==='/api/lab/storage-picker'")){const anchor="url.pathname==='/api/lab/storage-target/hello')";if(s.split(anchor).length!==2)throw Error('R1390 storage host changed');s=s.replace(anchor,"url.pathname==='/api/lab/storage-target/hello'||url.pathname==='/api/lab/storage-picker')");fs.writeFileSync(host,s);}
 for(const name of ['package.json','package-lock.json']){const p=path.join(root,name),d=JSON.parse(fs.readFileSync(p));d.version='1.0.26';if(d.packages?.[''])d.packages[''].version=d.version;fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n')}
 for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const p=path.join(root,name);fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/1\.0\.25/g,'1.0.26'))}
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));module.exports={integrate};
