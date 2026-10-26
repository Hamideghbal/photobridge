'use strict';
const fs=require('node:fs'),path=require('node:path');
function integrate(root,repo=path.resolve(__dirname,'..')){
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1470 native anchor changed');return s.replace(a,b)};
 for(const name of ['intake-sources.cjs','intake-sources.js'])fs.copyFileSync(path.join(repo,'apps/lab-desktop',name),path.join(root,name));
 const file=path.join(root,'main.cjs');let main=fs.readFileSync(file,'utf8');if(!main.includes('/* R1470 native intake */'))main=once(main,"require('./configured-storage.cjs').installConfiguredStorage(nativeStorage);","require('./intake-sources.cjs').installIntakeSources(nativeStorage,async()=>{await show();return dialog.showOpenDialog(win,{title:'انتخاب عکس‌ها برای انتقال',buttonLabel:'انتخاب عکس‌ها',properties:['openFile','multiSelections'],filters:[{name:'عکس',extensions:['jpg','jpeg','png','tif','tiff','webp']}]})});/* R1470 native intake */require('./configured-storage.cjs').installConfiguredStorage(nativeStorage);");fs.writeFileSync(file,main);
 const bridge=path.join(root,'native-storage.js');let js=fs.readFileSync(bridge,'utf8');js=js.split('/* R1470 native intake handles */')[0].trimEnd();js+='\n/* R1470 native intake handles */\n'+fs.readFileSync(path.join(root,'intake-sources.js'),'utf8');fs.writeFileSync(bridge,js);
 for(const name of ['package.json','package-lock.json']){const f=path.join(root,name),p=JSON.parse(fs.readFileSync(f));p.version='1.0.31';if(p.packages?.[''])p.packages[''].version=p.version;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');}
 for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const f=path.join(root,name);if(fs.existsSync(f))fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/1\.0\.30/g,'1.0.31'));}
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));module.exports={integrate};
