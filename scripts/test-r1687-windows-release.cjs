'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {integrate,version}=require('./integrate-r1687-windows-release.cjs');
test('R1687 fixes the native version for a newer 1.0.93 installation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb1687-'));
 try{
  fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'photobridge-lab-desktop',version:'1.0.39'}));
  fs.writeFileSync(path.join(dir,'package-lock.json'),JSON.stringify({version:'1.0.39',packages:{'':{version:'1.0.39'}}}));
  fs.writeFileSync(path.join(dir,'BUILD-WINDOWS.cmd'),'PhotoBridge Lab 1.0.39');
  integrate(dir);
  assert.equal(version,'1.0.94');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'package.json'))).version,'1.0.94');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'package-lock.json'))).packages[''].version,'1.0.94');
  assert(fs.readFileSync(path.join(dir,'BUILD-WINDOWS.cmd'),'utf8').includes('1.0.94'));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('R1687 updater differentiates UI check from native version check',()=>{
 const src=fs.readFileSync('apps/lab-desktop/app-update-main.cjs','utf8');
 assert(src.includes('async function check(manual=false,quietCurrent=false)'));
 assert(src.includes('return result'));
 const ui=fs.readFileSync('apps/lab-desktop/ui-update.cjs','utf8');
 assert(ui.includes('retryFailedBuild=false'));
 const unified=fs.readFileSync('apps/lab-desktop/unified-updates.cjs','utf8');
 assert(unified.includes('checkUiOnly:')||unified.includes('return{check,checkUiOnly}'));
});
