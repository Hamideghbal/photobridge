'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('dist/api/server.js','utf8'),ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const a=src.indexOf('async function albumOrderSnapshot('),b=src.indexOf('\nasync function ',a+18);
assert(a>=0&&b>a,'album snapshot function must remain accessible');
const base={enabled:true,printTariffCatalog:{
 types:[{id:'album_binding_price',kind:'binding',name:'صحافی جدید استاندارد',active:true},{id:'c_12345678-1234-4123-8123-123456789abc',kind:'binding',name:'صحافی فلت ضخیم ۳۰۰ گرم',active:true}],
 rates:{'print-size-1':{'c_12345678-1234-4123-8123-123456789abc':75}}
},sizes:[{id:'album-size-1',printSizeId:'print-size-1',label:'۲۰×۳۰',widthCm:20,heightCm:30,minSpreads:1,maxSpreads:300,bindingPrice:10,luster:15,silk:20,metallic:25}],
 covers:[{id:'cover',name:'مخمل',price:150,colors:[]}],extras:[],packages:[]};
const input={sizeId:'album-size-1',spreads:3,paperType:'luster',coverId:'cover'};
function snapshot(catalog){return vm.runInNewContext('('+src.slice(a,b)+')',{albumCatalogForLab:async()=>catalog,albumMoney:n=>Math.max(0,Math.round(Number(n||0))),invoicePrintTypeLabel:s=>({luster:'لاستر',silk:'سیلک',metallic:'متالیک'}[s]||s),Date});}
test('photographer binding selector appears before album size and paper and retains draft choice',()=>{
 assert.doesNotThrow(()=>new vm.Script(ui));
 assert(ui.includes('/* PB1539 photographer album binding per-size selector */'));
 const form=ui.slice(ui.indexOf('function Kv('),ui.indexOf('function ',ui.indexOf('function Kv(')+12));
 assert(form.indexOf('"نوع صحافی"')<form.indexOf('"سایز آلبوم"'));
 assert(form.indexOf('"سایز آلبوم"')<form.indexOf('"نوع کاغذ"'));
 for(const marker of ['bindingTypeId:pb1539Binding','pb1539SetBinding(String(ht.bindingTypeId))','pb1539Sizes.map','pb1539PriceOf','si=Q?0:Number(pb1539Price||0)'])assert(form.includes(marker),marker);
 assert(form.includes('disabled:je||!!he.current'),'already-created orders must retain their chosen binding');
 assert(form.includes('children:[pb1539Chosen.name," · "'),'photographer quote must show chosen model');
 assert(form.includes('children:Q||!pb1539Price?"قیمت‌گذاری لابراتوار":V(_a)'),'unpriced model does not display zero');
 const lab=ui.slice(ui.indexOf('function Vl('),ui.indexOf('function ',ui.indexOf('function Vl(')+12));
 assert(lab.includes('className:"pb1539BindingFact"'));
 assert(lab.includes('s?.binding?.name||"صحافی آلبوم"'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('&albumBinding=r1539'));
});
test('selected binding id and name are locked in order and change per-size binding price',async()=>{
 const fn=snapshot(base);
 const first=await fn('lab',input);
 assert.equal(first.binding.id,'album_binding_price');
 assert.equal(first.binding.name,'صحافی جدید استاندارد');
 assert.equal(first.pricing.bindingPrice,10);
 assert.equal(first.pricing.bindingTotal,30);
 const selected=await fn('lab',{...input,bindingTypeId:'c_12345678-1234-4123-8123-123456789abc'});
 assert.equal(selected.binding.name,'صحافی فلت ضخیم ۳۰۰ گرم');
 assert.equal(selected.binding.unitPrice,75);
 assert.equal(selected.pricing.bindingPrice,75);
 assert.equal(selected.pricing.bindingTotal,225);
 assert.equal(selected.pricing.total-first.pricing.total,195);
});
test('unpriced custom model cannot silently charge the legacy binding rate; inactive model rejected',async()=>{
 const fn=snapshot({...base,printTariffCatalog:{...base.printTariffCatalog,rates:{}}});
 const id='c_12345678-1234-4123-8123-123456789abc';
 const missing=await fn('lab',{...input,bindingTypeId:id});
 assert.equal(missing.binding.unitPrice,null);
 assert.equal(missing.pricing.manualBindingRequired,true);
 assert.equal(missing.pricing.total,null);
 await assert.rejects(fn('lab',{...input,bindingTypeId:'not-real'}),{message:'album_binding_invalid'});
 const noChoice=snapshot({...base,printTariffCatalog:{...base.printTariffCatalog,types:base.printTariffCatalog.types.map(t=>t.id===id?{...t,active:false}:t)}});
 await assert.rejects(noChoice('lab',{...input,bindingTypeId:id}),{message:'album_binding_invalid'});
});
test('invoice label comes from chosen binding snapshot, with old orders retaining fallback name',()=>{
 assert(src.includes("String(ad?.binding?.name||'صحافی آلبوم')"));
 assert(src.includes('binding: bindingSnapshot'));
 assert(src.includes('const customBindings=pbCatalog.types.filter'));
});
