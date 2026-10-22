'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const main=fs.readFileSync('apps/lab-desktop/main.cjs','utf8');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
test('R1362 native lab keeps a stable loopback origin for previously granted directory access',()=>{
 assert.match(main,/server\.listen\(43761,'127\.0\.0\.1'/);
 assert.doesNotMatch(main,/server\.listen\(0,'127\.0\.0\.1'/);
 assert.match(main,/server\.once\('error',fail\)/);
});
test('FileSystem permission is granted only to the trusted loopback Electron window',()=>{
 const a=main.indexOf('const pb1362NativeFilePermission='),b=main.indexOf('win.webContents.session.setPermissionRequestHandler(',a);
 assert(a>=0&&b>a);
 const own={getURL:()=> 'http://127.0.0.1:43761/lab'},win={webContents:own};
 const allow=vm.runInNewContext(main.slice(a,b)+'\npb1362NativeFilePermission',{win,URL,origin:'http://127.0.0.1:43761'});
 assert.equal(allow(own,'fileSystem','http://127.0.0.1:43761/lab'),true);
 assert.equal(allow(own,'fileSystem','https://attacker.invalid/'),false);
 assert.equal(allow(own,'notifications','http://127.0.0.1:43761/lab'),false);
 assert.equal(allow({},'fileSystem','http://127.0.0.1:43761/lab'),false);
 assert.match(main,/session\.setPermissionCheckHandler/);
 assert.match(main,/nodeIntegration:false,contextIsolation:true,sandbox:true/);
});
test('folder registry and photo operations are preserved while concurrent dialogs are prevented',async()=>{
 assert.match(ui,/PB1362 single-flight Lab folder picker/);
 assert.match(ui,/await window\.showDirectoryPicker\(\{mode:"readwrite"\}\)/);
 assert.match(ui,/await Oy\(handle\)/);
 const a=ui.indexOf('/* PB1362 single-flight Lab folder picker */'),b=ui.indexOf('async function Vs(t)',a);
 assert(a>=0&&b>a);
 let calls=0,save=0,resolve;
 const handle={queryPermission:async()=> 'granted',isSameEntry:async other=>other===handle};
 const no=vm.runInNewContext(ui.slice(a,b)+';no',{ai:()=>true,window:{showDirectoryPicker:()=>{calls++;return new Promise(r=>resolve=r)}},Vs:async()=>true,Oy:async()=>{save++},qs:async()=>handle,console});
 const p1=no(),p2=no();assert.equal(calls,1);resolve(handle);
 assert.equal(await p1,handle);assert.equal(await p2,handle);assert.equal(save,1);
 const p3=no();assert.equal(calls,2);resolve(handle);assert.equal(await p3,handle);
});
test('Electron re-installs picker guard when a new site UI release downloads',async()=>{
 assert.match(main,/webContents\.on\('dom-ready'/);
 assert.match(main,/webContents\.getURL\(\)\.startsWith\(origin\+'\/'\)/);
 const m=main.match(/executeJavaScript\(`([^`]+)`\)/);assert(m);
 let count=0,resolve;const dir={name:'print'};
 const window={showDirectoryPicker:()=>{count++;return new Promise(r=>resolve=r)}};
 vm.runInNewContext(m[1],{window,Promise});
 const p1=window.showDirectoryPicker(),p2=window.showDirectoryPicker();assert.equal(count,1);
 resolve(dir);assert.equal(await p1,dir);assert.equal(await p2,dir);
});
test('R1342 status diagnostic fixture and assertions use the same native 1.0.19 version',()=>{
 const source=fs.readFileSync('scripts/test-r1342-native-integration.cjs','utf8');
 assert(source.includes("nativeVersion:'1.0.19'"),'status mock must not report old 1.0.18');
 assert(source.includes("assert.equal(status.nativeVersion,'1.0.19')"),'status contract still checked');
 assert(source.includes("assert.equal(pkg.version,'1.0.19')"),'package version still checked');
 assert(!source.includes("nativeVersion:'1.0.18'"),'old fixture version must not be left behind');
});
test('native 1.0.19 package version and lockfile match without deleting user state',()=>{
 const pkg=JSON.parse(fs.readFileSync('apps/lab-desktop/package.json','utf8'));
 const lock=JSON.parse(fs.readFileSync('apps/lab-desktop/package-lock.json','utf8'));
 assert.equal(pkg.version,'1.0.19');assert.equal(lock.version,'1.0.19');assert.equal(lock.packages[''].version,'1.0.19');
 assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);
 assert.match(main,/path\.join\(dir,'lab\.sqlite'\)/);
});