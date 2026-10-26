'use strict';const fs=require('node:fs'),path=require('node:path');
function integrate(root,repo=path.resolve(__dirname,'..')){
 fs.copyFileSync(path.join(repo,'apps/lab-desktop/live-finance.cjs'),path.join(root,'live-finance.cjs'));
 const file=path.join(root,'host.cjs');let host=fs.readFileSync(file,'utf8');if(!host.includes('/* R1472 confirmed financial writes */')){const a="        if(['GET','HEAD'].includes(req.method)){";if(host.split(a).length!==2)throw Error('R1472 host anchor changed');host=host.replace(a,"        /* R1472 confirmed financial writes */if(await require('./live-finance.cjs').forwardLiveFinance({req,res,bytes,contentType,store,request,json}))return;\n"+a);fs.writeFileSync(file,host);}
 for(const name of ['package.json','package-lock.json']){const file=path.join(root,name),p=JSON.parse(fs.readFileSync(file));p.version='1.0.33';if(p.packages?.[''])p.packages[''].version=p.version;fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');}
 for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const file=path.join(root,name);if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/1\.0\.32/g,'1.0.33'));}
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));module.exports={integrate};
