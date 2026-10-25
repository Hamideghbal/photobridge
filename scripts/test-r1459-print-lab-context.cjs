const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
test('lab context source retains the current lab and original lab-change handlers',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),start=ui.indexOf('e.jsx("select",{hidden:true,className:"pb1459LabSource"'),end=ui.indexOf('}),d.length>1?',start)+2;assert(start>0&&end>start);
 let changed='';const context={e:{jsx:(tag,props)=>({tag,props})},p:{lab:{name:'آزمایشی'}},_e:'2',W:false,d:[{value:'1',label:'اول'},{value:'2',label:'دوم'}],je:true,A:value=>changed='A:'+value,_:value=>changed='_:'+value};
 let source=vm.runInNewContext(ui.slice(start,end),context).props;assert.equal(source.value,'2');assert.equal(source['data-lab-name'],'آزمایشی');assert.equal(source.hidden,true);assert.equal(source.children.length,2);source.onChange({target:{value:'1'}});assert.equal(changed,'A:1');
 context.je=false;context.W=true;source=vm.runInNewContext(ui.slice(start,end),context).props;assert.equal(source.disabled,true);source.onChange({target:{value:'2'}});assert.equal(changed,'_:2');
});
test('identity hide is removed and context transform is idempotent and versioned',()=>{
 const css=fs.readFileSync('scripts/r1458-photographer-print-toolbar.css','utf8');assert(!css.includes('>.photographerHeaderIdentity{display:none'));assert(css.includes('order:-1!important'));
 const files=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1126-desktop-navigation.js','dist/web/photobridge-r1126-desktop-navigation.css','dist/web/index.html','dist/api/equipment-rental-book.html'],before=files.map(f=>fs.readFileSync(f,'utf8'));
 assert(before[1].includes("currentDocument()?.querySelector('select.pb1459LabSource')"));assert(before[3].includes('labContext=r1459'));
 execFileSync(process.execPath,['scripts/enable-r1459-print-lab-context.mjs']);files.forEach((f,i)=>assert.equal(fs.readFileSync(f,'utf8'),before[i],f));
});
