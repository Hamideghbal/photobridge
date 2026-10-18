import fs from 'node:fs';
const file='apps/lab-desktop/main.cjs';
if(!fs.existsSync(file))throw Error('Restore native Windows sources before enabling integrated alerts');
let src=fs.readFileSync(file,'utf8');
if(!src.includes("require('./native-alerts.cjs')")){
 const replace=(from,to)=>{if(src.split(from).length!==2)throw Error('R1296 native source anchor changed: '+from);src=src.replace(from,to);};
 replace('sync=new Sync({store,request,isOnline:()=>net.isOnline()});',`const {NativeAlerts}=require('./native-alerts.cjs');const nativeAlerts=new NativeAlerts({store,request,getAccount:()=>store.get('auth')?store.get('labId'):null,isSupported:()=>Notification.isSupported(),notify:(options,onClick)=>{const n=new Notification(options);n.on('click',onClick);n.show()},open:()=>void show()});app.on('before-quit',()=>nativeAlerts.stop());sync=new Sync({store,request,isOnline:()=>net.isOnline()});`);
 replace('store.set(\'auth\',auth);sync.resume();',"store.set('auth',auth);nativeAlerts.start();sync.resume();");
 replace('onLogout:async()=>{authEpoch++;', 'onLogout:async()=>{nativeAlerts.stop();authEpoch++;');
 replace("else{void primeCache();void sync.run()}","else{nativeAlerts.start();void primeCache();void sync.run()}");
 fs.writeFileSync(file,src);
}
// New native behavior requires a distinguishable installer version.
for(const filename of ['apps/lab-desktop/package.json','apps/lab-desktop/package-lock.json']){
 if(!fs.existsSync(filename))continue;
 const pkg=JSON.parse(fs.readFileSync(filename,'utf8'));
 pkg.version='1.0.15';if(pkg.packages?.[''])pkg.packages[''].version='1.0.15';
 fs.writeFileSync(filename,JSON.stringify(pkg,null,2)+'\n');
}
