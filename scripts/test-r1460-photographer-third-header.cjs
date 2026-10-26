const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('third-header transform preserves runtime JavaScript and is idempotent',()=>{
 const scripts=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1126-desktop-navigation.js'],runtime=scripts.map(f=>fs.readFileSync(f,'utf8'));
 const files=['dist/web/photobridge-r1126-desktop-navigation.css','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));assert(before[1].includes('thirdHeader=r1460'));
 execFileSync(process.execPath,['scripts/enable-r1460-photographer-third-header.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));scripts.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),runtime[i],f));
});
