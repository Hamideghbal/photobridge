/** R1362: preserve local folder handle storage across Windows app launches,
 * and grant fileSystem access ONLY to this app's loopback webContents.
 * User still selects the directory in the OS picker; no broad file access.
 */
import fs from 'node:fs';
const path='apps/lab-desktop/main.cjs';let main=fs.readFileSync(path,'utf8');
function patch(oldValue,newValue,label){
 if(main.includes(newValue))return;
 if(main.split(oldValue).length!==2)throw Error('[R1362] unexpected native code: '+label);
 main=main.replace(oldValue,newValue);
}
const original="await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;";
const stable="/* PB1362 stable loopback storage origin */await new Promise((resolve,reject)=>{const fail=e=>{server.off('error',fail);reject(new Error('Lab storage port 43761 unavailable: '+e.message))};server.once('error',fail);server.listen(43761,'127.0.0.1',()=>{server.off('error',fail);resolve()})});origin='http://127.0.0.1:'+server.address().port;";
patch(original,stable,'stable origin');
const deny='win.webContents.session.setPermissionRequestHandler((_wc,_p,cb)=>cb(false));';
const limited=`/* PB1362 local-only filesystem access, deny all other Electron permissions */
 const pb1362NativeFilePermission=(wc,permission,requester)=>{if(permission!=='fileSystem'||wc!==win.webContents)return false;try{return new URL(requester||wc.getURL()).origin===origin}catch{return false}};
 win.webContents.session.setPermissionRequestHandler((wc,p,cb,details)=>cb(pb1362NativeFilePermission(wc,p,details?.requestingUrl)));
 win.webContents.session.setPermissionCheckHandler((wc,p,requestingOrigin)=>pb1362NativeFilePermission(wc,p,requestingOrigin));`;
patch(deny,limited,'file-system permission');
const packages=['apps/lab-desktop/package.json','apps/lab-desktop/package-lock.json'];
for(const p of packages){if(!fs.existsSync(p))continue;const obj=JSON.parse(fs.readFileSync(p,'utf8'));if(!['1.0.18','1.0.19'].includes(obj.version))throw Error('[R1362] unexpected native app version '+obj.version);}
const testFile='scripts/test-r1342-native-integration.cjs';
let test=fs.readFileSync(testFile,'utf8');
for(const [before,after] of [
 ["assert.equal(status.nativeVersion,'1.0.18')","assert.equal(status.nativeVersion,'1.0.19')"],
 ["assert.equal(pkg.version,'1.0.18')","assert.equal(pkg.version,'1.0.19')"]
]){
 if(!test.includes(after)){if(test.split(before).length!==2)throw Error('[R1362] unknown native version test format');test=test.replace(before,after);}
}
fs.writeFileSync(path,main);
fs.writeFileSync(testFile,test);
for(const p of packages){if(!fs.existsSync(p))continue;const obj=JSON.parse(fs.readFileSync(p,'utf8'));obj.version='1.0.19';if(obj.packages?.[''])obj.packages[''].version='1.0.19';fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n');}
console.log('[R1362] Fixed per-app origin 127.0.0.1:43761, scoped fileSystem consent, native version 1.0.19');
