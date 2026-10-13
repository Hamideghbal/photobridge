const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1184-album-intake-paper.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const api=fs.readFileSync('dist/api/server.js','utf8');
test('detail print paper label is readable at rest with normalized text and minimum width',()=>{
 assert.match(css,/\.pb1180PhotoTools select\.pb1180Paper/);
 assert.match(css,/font:750 12\.5px\/1\.3/);
 assert.match(css,/color:#152b4a!important/);
 assert.match(css,/min-width:68px!important/);
 assert.match(css,/background:#fff!important/);
});
test('lab album tab gives native album walk-in action and opens album mode',()=>{
 assert.match(intake,/async function open\(mode="print"\)\{const albumMode=mode==="album"/);
 assert.match(intake,/ثبت سفارش آلبوم حضوری/);
 assert.match(intake,/old\.onclick=\(\)=>open\(albumTab\?'album':'print'\)/);
 assert.match(intake,/button\.onclick=\(\)=>open\(albumTab\?'album':'print'\)/);
 assert.match(intake,/bootstrap\.album\?\.sizes/);
});
test('album uses exactly one size for all its spreads and blocks duplicate page files',()=>{
 assert.match(intake,/defaultSize\.disabled=albumMode&&groups\.length>0/);
 assert.match(intake,/if\(albumMode&&groups\.length\)defaultSize\.disabled=true/);
 assert.match(intake,/برای هر سفارش آلبوم فقط یک سایز مجاز است/);
 assert.match(intake,/if\(albumMode\)throw Error\('این فایل قبلاً به لت‌های آلبوم اضافه شده است/);
 assert.match(intake,/if\(!albumMode\)photo\.append\(quantity\)/);
 assert.match(intake,/if\(!albumMode\)actions\.append\(chassisLabel\)/);
});
test('album card includes cover model/colors, custom cover notes, package, extras, ordering, and general notes',()=>{
 for(const field of ['جلد آلبوم','رنگ جلد','توضیحات جلد سفارشی','باکس / کیف آلبوم','خدمات اضافه','ترتیب چاپ صفحات','متن روی جلد','یادداشت سفارش آلبوم'])assert.ok(intake.includes(field),field);
 assert.match(intake,/function pb1184AlbumConfigurator/);
 assert.match(intake,/cover\.value==='__custom__'/);
 assert.match(intake,/selected\?\.colors/);
 assert.match(intake,/extraIds:/);
 assert.match(intake,/printOrderNotes:/);
 assert.match(intake,/coverRequest:/);
});
test('album collection validates real page count and sends canonical albumData to delegated API',()=>{
 assert.match(intake,/sizeId:size\.id,spreads:entries\.length/);
 assert.match(intake,/paperCounts/);
 assert.match(intake,/mode:albumMode\?'album':'print',albumData/);
 assert.match(intake,/albumForm\.collect\(\)/);
 assert.match(api,/albumOrderSnapshot\(labId, b\.albumData \|\| \{\}\)/);
 assert.match(api,/album_file_count_mismatch/);
});
test('existing print intake and device-local workflow stays intact',()=>{
 assert.match(intake,/printSizes/);
 assert.match(intake,/mode:albumMode\?'album':'print'/);
 assert.match(intake,/storageMode!=='device-local'/);
 assert.match(intake,/provider\.write/);
 assert.match(intake,/provider\.saveResume/);
 assert.match(intake,/\/api\/lab\/delegated-orders\/'\+order\.orderId\+'\/submit/);
});
test('UI loads album styles and current intake script version',()=>{
 assert.match(html,/photobridge-r1184-album-intake-paper\.css\?v=r1184/);
 assert.match(html,/photobridge-r1137-lab-local-intake\.js\?v=r1184/);
 assert.match(css,/pb1184AlbumPanel/);
 assert.match(css,/pb1184AlbumGrid/);
});
