'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.resolve(process.argv[2]||'apps/lab-desktop');
let main=fs.readFileSync(path.join(root,'main.cjs'),'utf8');const anchor="win.webContents.session.setPermissionRequestHandler((_wc,_p,cb)=>cb(false));win.webContents.session.setPermissionCheckHandler(()=>false);";
if(!main.includes("require('./microphone.cjs')")){if(main.split(anchor).length!==2)throw Error('R1402 microphone anchor changed');main=main.replace(anchor,"require('./microphone.cjs').installMicrophone({session:win.webContents.session,getWindow:()=>win,getOrigin:()=>origin,dialog});");fs.writeFileSync(path.join(root,'main.cjs'),main)}
let host=fs.readFileSync(path.join(root,'host.cjs'),'utf8');if(!host.includes('/* PB1402 voice direct */')){const anchor="if(contentType.startsWith('multipart/form-data')||OFFLINE_BLOCK.test(url.pathname))";if(host.split(anchor).length!==2)throw Error('R1402 host anchor changed');host=host.replace(anchor,"/* PB1402 voice direct */if((req.method==='POST'&&/^\\/api\\/lab\\/chat\\/[0-9a-f-]+\\/voice$/.test(url.pathname))||contentType.startsWith('multipart/form-data')||OFFLINE_BLOCK.test(url.pathname))");fs.writeFileSync(path.join(root,'host.cjs'),host)}
fs.copyFileSync(path.join(__dirname,'r1402-native/microphone.cjs'),path.join(root,'microphone.cjs'));
for(const name of ['package.json','package-lock.json']){const file=path.join(root,name),data=JSON.parse(fs.readFileSync(file));data.version='1.0.30';if(data.packages?.[''])data.packages[''].version=data.version;fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n')}
for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const file=path.join(root,name);if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/1\.0\.29/g,'1.0.30'))}

fs.copyFileSync(path.join(__dirname,'r1402-native/voice-host.test.cjs'),path.join(root,'test/voice-host.test.cjs'));
