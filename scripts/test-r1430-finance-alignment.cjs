const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('finance alignment build output is repeatable, valid and cache-versioned',()=>{
 const files=['dist/web/photobridge-r1372-third-header.js','dist/web/photobridge-r1423-finance-bars.css','dist/web/index.html'],before=files.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1430-finance-alignment.mjs']);files.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));execFileSync(process.execPath,['--check',files[0]]);
 assert(before[2].includes('photobridge-r1372-third-header.js?v=r1430'));assert(before[2].includes('photobridge-r1423-finance-bars.css?v=r1430'));
});
