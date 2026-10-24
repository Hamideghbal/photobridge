'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'apps/lab-desktop');
for(const name of ['main.cjs','alert-window.cjs','alert-preload.cjs','alert-renderer.js','alert.html','chat-alerts.cjs','quick-reply.cjs'])fs.copyFileSync(path.join(__dirname,'r1400-native',name),path.join(root,name));
for(const name of ['package.json','package-lock.json']){const file=path.join(root,name),data=JSON.parse(fs.readFileSync(file));data.version='1.0.29';if(data.packages?.[''])data.packages[''].version=data.version;fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n')}
for(const name of ['BUILD-WINDOWS.cmd','BUILD-WINDOWS-SIGNED.cmd','test/automatic-ui.test.cjs']){const file=path.join(root,name);if(fs.existsSync(file))fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/1\.0\.28/g,'1.0.29'))}
const testFile=path.join(root,'test/alerts.test.cjs');let test=fs.readFileSync(testFile,'utf8');test=test.replace('closing outstanding popup keeps it visible; accepting visible IDs preserves arrivals','closing hides without acknowledgment; accepting visible IDs preserves arrivals').replace('assert.equal(s.controller.window.visible,true);s.controller.present({items:', 'assert.equal(s.controller.window.visible,false);s.controller.present({items:');fs.writeFileSync(testFile,test);
fs.copyFileSync(path.join(__dirname,'r1400-native/quick-reply.test.cjs'),path.join(root,'test/quick-reply.test.cjs'));
