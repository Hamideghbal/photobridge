'use strict';
const fs=require('node:fs'),path=require('node:path');
function integrate(root,repo=path.resolve(__dirname,'..')){
 fs.copyFileSync(path.join(repo,'apps/lab-desktop/app-update-main.cjs'),path.join(root,'app-update-main.cjs'));
 for(const name of ['package.json','package-lock.json']){const file=path.join(root,name),data=JSON.parse(fs.readFileSync(file));data.version='1.0.39';if(data.packages?.[''])data.packages[''].version=data.version;fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n')}
 for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const file=path.join(root,name);if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/1\.0\.38/g,'1.0.39'))}
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));
module.exports={integrate};
