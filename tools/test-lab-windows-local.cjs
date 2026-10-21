const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'tools/build-lab-windows-local.mjs'),'utf8');

test('local lab builder is not dependent on GitHub Actions or a fake EXE',()=>{
  assert.match(script,/desktop-sources.*PhotoBridge-Desktop-Sources-R1089\.zip/);
  assert.match(script,/archiveSha256/);
  assert.match(script,/desktop-overlay\.js.*ui-update\.cjs/s);
  assert.match(script,/enable-r1342-lab-ui-update\.mjs/);
  assert.match(script,/npm\.cmd/);
  assert.match(script,/dist:unsigned/);
  assert.match(script,/--signed/);
  assert.match(script,/process\.platform !== 'win32'/);
  assert.match(script,/sha256: checksum/);
  const batch=fs.readFileSync(path.join(root,'BUILD-LAB-WINDOWS.cmd'),'utf8');
  assert.match(batch,/node tools\\build-lab-windows-local\.mjs/);
});

function fixture(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-lab-local-builder-test-'));
  for(const directory of ['tools','desktop-sources','apps/lab-desktop','dist/web','scripts'])fs.mkdirSync(path.join(temp,directory),{recursive:true});
  fs.copyFileSync(path.join(root,'tools/build-lab-windows-local.mjs'),path.join(temp,'tools/build-lab-windows-local.mjs'));
  fs.copyFileSync(path.join(root,'desktop-sources/PhotoBridge-Desktop-Sources-R1089.zip'),path.join(temp,'desktop-sources/PhotoBridge-Desktop-Sources-R1089.zip'));
  fs.writeFileSync(path.join(temp,'dist/web/index.html'),'<html>new lab UI</html>');
  fs.writeFileSync(path.join(temp,'apps/lab-desktop/desktop-overlay.js'),'LATEST OVERLAY');
  fs.writeFileSync(path.join(temp,'apps/lab-desktop/ui-update.cjs'),'LATEST UPDATER');
  for(const name of ['enable-r1296-native-alerts.mjs','enable-r1342-lab-ui-update.mjs','prepare-lab-desktop-ui.mjs','prepare-lab-installer-assets.mjs']){
    const patch = name==='enable-r1342-lab-ui-update.mjs'
      ? "import fs from 'node:fs';let file='apps/lab-desktop/package.json';let p=JSON.parse(fs.readFileSync(file,'utf8'));p.version='1.0.16';fs.writeFileSync(file,JSON.stringify(p));"
      : "console.log('stub step passed')";
    fs.writeFileSync(path.join(temp,'scripts',name),patch);
  }
  for(const name of ['test-r1296-native-alerts.cjs','test-r1342-lab-ui-update.cjs','test-r1342-native-integration.cjs','test-r1343-lab-installer-build.cjs'])fs.writeFileSync(path.join(temp,'scripts',name),"require('node:test')('placeholder fixture',()=>{});");
  return {temp,run:()=>spawnSync(process.execPath,['tools/build-lab-windows-local.mjs','--prepare-only'],{cwd:temp,encoding:'utf8'}),close:()=>fs.rmSync(temp,{recursive:true,force:true})};
}
test('offline preparation restores canonical lab source without overwriting newer updater or store',()=>{
  if(process.platform==='win32')return;
  const f=fixture();try{
    const result=f.run();assert.equal(result.status,0,result.stderr+'\n'+result.stdout);
    const app=path.join(f.temp,'apps/lab-desktop');
    assert.equal(fs.readFileSync(path.join(app,'desktop-overlay.js'),'utf8'),'LATEST OVERLAY');
    assert.equal(fs.readFileSync(path.join(app,'ui-update.cjs'),'utf8'),'LATEST UPDATER');
    assert.equal(JSON.parse(fs.readFileSync(path.join(app,'package.json'),'utf8')).version,'1.0.16');
    assert(fs.existsSync(path.join(app,'main.cjs')));
    assert(!fs.existsSync(path.join(app,'release')));
    assert(!fs.existsSync(path.join(f.temp,'apps/store-desktop')));
  }finally{f.close()}
});
test('builder stops before touching the app when archive checksum has changed',()=>{
  if(process.platform==='win32')return;
  const f=fixture();try{
    fs.appendFileSync(path.join(f.temp,'desktop-sources/PhotoBridge-Desktop-Sources-R1089.zip'),'tampered');
    const result=f.run();assert.notEqual(result.status,0);
    assert.match(result.stderr,/does not match its verified SHA-256/);
    assert(!fs.existsSync(path.join(f.temp,'apps/lab-desktop/main.cjs')));
  }finally{f.close()}
});
