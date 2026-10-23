'use strict';
const fs=require('node:fs'),path=require('node:path');
function integrate(root,repository=process.cwd()){
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1386 native changed anchor '+a.slice(0,100));return s.replace(a,b)};
 const main=path.join(root,'main.cjs');let s=fs.readFileSync(main,'utf8');if(!s.includes('/* R1386 configured storage */')){s=once(s,'const removeStorageIPC=installStorageIPC(',"require('./configured-storage.cjs').installConfiguredStorage(nativeStorage);/* R1386 configured storage */const removeStorageIPC=installStorageIPC(");fs.writeFileSync(main,s)}
 fs.copyFileSync(path.join(repository,'apps/lab-desktop/configured-storage.cjs'),path.join(root,'configured-storage.cjs'));
 const storage=path.join(root,'native-storage.cjs');s=fs.readFileSync(storage,'utf8');if(!s.includes("action==='activate-configured'")){s=once(s,"if(action==='choose')", "if(action==='activate-configured')value=await storage.activateConfigured(payload?.force,payload?.revision);else if(action==='choose')");fs.writeFileSync(storage,s)}
 const bridge=path.join(root,'native-storage.js');s=fs.readFileSync(bridge,'utf8');if(!s.includes('activateConfigured:')){s=once(s,"device:()=>invoke('device'),", "activateConfigured:(force,revision)=>invoke('activate-configured',{force:force===true,revision}),device:()=>invoke('device'),");fs.writeFileSync(bridge,s)}
 const host=path.join(root,'host.cjs');s=fs.readFileSync(host,'utf8');if(!s.includes('/* R1386 live storage target */')){s=once(s,"if(url.pathname==='/api/lab/download-device'&&['GET','POST'].includes(req.method))", "/* R1386 live storage target */if((url.pathname==='/api/lab/download-device'||url.pathname==='/api/lab/storage-target'||url.pathname==='/api/lab/storage-target/activate')&&['GET','PUT','POST'].includes(req.method))");s=once(s,"...(req.method==='POST'?{body:bytes,headers:{'Content-Type':'application/json'}}:{})", "...(['POST','PUT'].includes(req.method)?{body:bytes,headers:{'Content-Type':'application/json'}}:{})");fs.writeFileSync(host,s)}
 for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const file=path.join(root,name);if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/1\.0\.22/g,'1.0.23'));}
 for(const name of ['package.json','package-lock.json']){const file=path.join(root,name),p=JSON.parse(fs.readFileSync(file));p.version='1.0.23';if(p.packages?.[''])p.packages[''].version='1.0.23';fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n')}
}
if(require.main===module)integrate(path.resolve(process.argv[2]||'apps/lab-desktop'));
module.exports={integrate};
