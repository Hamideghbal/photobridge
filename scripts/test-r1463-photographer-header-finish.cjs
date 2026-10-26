const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
test('lab display labels add the photo-lab prefix exactly once',()=>{
 const js=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8'),start=js.indexOf('function pb1463LabLabel('),end=js.indexOf('\n function pb1459LabContext',start);assert(start>0&&end>start);
 const label=value=>vm.runInNewContext(js.slice(start,end)+'\npb1463LabLabel(value)',{value});
 for(const value of ['مثبت','لابراتوار مثبت','لابراتوار عکس مثبت'])assert.equal(label(value),'لابراتوار عکس مثبت');assert.equal(label(''),'لابراتوار عکس انتخاب‌شده');
});
test('header finish transform is idempotent and cache-versioned',()=>{
 const files=['dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r1126-desktop-navigation.css','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));assert(before[2].includes('headerFinish=r1463'));
 execFileSync(process.execPath,['scripts/enable-r1463-photographer-header-finish.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));
});
