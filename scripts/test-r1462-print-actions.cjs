const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('print action transform is idempotent and cache-versioned',()=>{
 const files=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r1126-desktop-navigation.css','dist/web/photobridge-print-delegation-v666.js','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));assert(before[4].includes('printActions=r1462'));
 execFileSync(process.execPath,['scripts/enable-r1462-print-actions.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));
});
