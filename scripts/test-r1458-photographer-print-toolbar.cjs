const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
test('common prices action uses current lab data and preserves the original mobile action',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),match=ui.match(/e\.jsx\("button",\{type:"button",className:"photographerPrintCommonAction pb1458LabPrices",disabled:W\|\|!p,onClick:\(\)=>window\.pb1178ShowLabPrices\?\.\(p\),children:"تعرفه‌های لابراتوار"\}\)/);
 assert(match,'native utility action present');const p={lab:{id:'active-lab'},prices:[{label:'20×30',luster:100}]};let received;
 const context={e:{jsx:(_,props)=>props},W:false,p,window:{pb1178ShowLabPrices:data=>received=data}};
 const props=vm.runInNewContext(match[0],context);props.onClick();assert.equal(received,p);assert.equal(props.disabled,false);
 context.W=true;assert.equal(vm.runInNewContext(match[0],context).disabled,true);context.W=false;context.p=null;assert.equal(vm.runInNewContext(match[0],context).disabled,true);
 assert(ui.includes('window.pb1178ShowLabPrices?.(t)'),'original mobile tariff source retained');
});
test('print toolbar styling is scoped and cache-versioned; transform is idempotent',()=>{
 const css=fs.readFileSync('scripts/r1458-photographer-print-toolbar.css','utf8');assert(css.includes('@media(min-width:821px)'));assert(css.includes('#pb1126DesktopHeader.pb1458PrintToolbar'));assert(css.includes('.pb1127PrintModes>button.active::after'));assert(css.includes('.simplePrintPilotHeaderActions>.pb1178LabPrices{display:none!important}'));
 const files=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r1126-desktop-navigation.css','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));
 assert(before[3].includes('printToolbar=r1458'));execFileSync(process.execPath,['scripts/enable-r1458-photographer-print-toolbar.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));
});
