const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('header build output remains valid, repeatable and cache-versioned',()=>{
 const paths=['dist/web/photobridge-r1372-third-header.js','dist/web/photobridge-r1423-finance-bars.css','dist/web/index.html'],before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1429-header-order.mjs']);paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));execFileSync(process.execPath,['--check',paths[0]]);
 assert(before[2].includes('photobridge-r1372-third-header.js?v=r1429'));assert(before[2].includes('photobridge-r1423-finance-bars.css?v=r1429'));
});
