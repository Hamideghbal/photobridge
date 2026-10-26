const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('desktop power glyph matches the manager component and notification source/badge are retained',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),icons=fs.readFileSync('dist/web/photobridge-r1163-desktop-gallery-header.js','utf8'),start=ui.indexOf('function Gl('),end=ui.indexOf('function Df(',start);assert(start>0&&end>start);
 for(const [,path]of ui.slice(start,end).matchAll(/d:"([^"]+)"/g))assert(icons.includes('d="'+path+'"'));
 assert(icons.includes("original.querySelector('.systemNotificationBellIcon')"));assert(icons.includes("original.querySelector('.systemNotificationBadge')"));
});
test('album/card layout transform is idempotent and refreshes delivered assets',()=>{
 const files=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r1126-desktop-navigation.css','dist/web/photobridge-r1318-print-insets.js','dist/web/photobridge-r1163-desktop-gallery-header.js','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));assert(before[5].includes('albumChrome=r1464'));assert(before[0].includes('pb1464OrderLabels'));assert(before[0].includes('pb1464Prepay'));
 execFileSync(process.execPath,['scripts/enable-r1464-photographer-album-layout.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));
});
