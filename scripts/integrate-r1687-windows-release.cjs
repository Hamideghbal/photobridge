'use strict';
/* R1687: one version for the fixed Windows Lab installer, preserving app identity and data. */
const fs=require('node:fs'),path=require('node:path');
const version='1.0.94';
function integrate(root){
 for(const name of ['package.json','package-lock.json']){
  const file=path.join(root,name),doc=JSON.parse(fs.readFileSync(file,'utf8'));
  doc.version=version;if(doc.packages?.[''])doc.packages[''].version=version;
  fs.writeFileSync(file,JSON.stringify(doc,null,2)+'\n');
 }
 const cmd=['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd'];
 for(const name of cmd){
  const file=path.join(root,name);if(!fs.existsSync(file))continue;
  const txt=fs.readFileSync(file,'utf8').replace(/1\.0\.\d+/g,version);
  fs.writeFileSync(file,txt);
 }
 return version;
}
module.exports={integrate,version};
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));
