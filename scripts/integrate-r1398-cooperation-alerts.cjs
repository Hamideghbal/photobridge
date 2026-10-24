'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'apps/lab-desktop');
for(const name of ['main.cjs','native-alerts.cjs'])fs.copyFileSync(path.join(__dirname,'r1398-native',name),path.join(root,name));
for(const name of ['package.json','package-lock.json']){const file=path.join(root,name),data=JSON.parse(fs.readFileSync(file));data.version='1.0.28';if(data.packages?.[''])data.packages[''].version=data.version;fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n')}
for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const file=path.join(root,name);if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/1\.0\.27/g,'1.0.28'))}

fs.copyFileSync(path.join(__dirname,'r1398-native/cooperation-alerts.test.cjs'),path.join(root,'test/cooperation-alerts.test.cjs'));
