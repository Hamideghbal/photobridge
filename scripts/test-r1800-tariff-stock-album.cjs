'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const helpers=fs.readFileSync('scripts/r1800-tariff-fields.js.txt','utf8'),ctx={};vm.createContext(ctx);vm.runInContext(helpers,ctx);
const models=[{id:'c_model',kind:'chassis',name:'شاسی حرفه‌ای بلند'},{id:'f_model',kind:'frame',name:'قاب چوبی کلاسیک بلند'},{id:'b_model',kind:'binding',name:'صحافی خاص'}];
const keys=rows=>Array.from(rows,r=>r[0]);
test('R1800 stock columns follow their own price, including base models and renamed headings',()=>{
 const input=[['luster','لاستر'],['chassis','شاسی اصلی تغییرنام‌یافته'],['pb1539_c_model',models[0].name],['pb1789_stock_c_model','موجودی قدیمی'],['chassis_stock','موجودی شاسی'],['frame','قاب اصلی'],['pb1539_f_model',models[1].name],['pb1789_stock_f_model','موجودی قدیمی'],['frame_stock','موجودی قاب'],['pb1539_b_model',models[2].name]],copy=JSON.stringify(input);
 const out=ctx.pb1800TariffFields(input,models);assert.deepEqual(keys(out),['luster','chassis','chassis_stock','pb1539_c_model','pb1789_stock_c_model','frame','frame_stock','pb1539_f_model','pb1789_stock_f_model','pb1539_b_model']);assert.equal(out[2][1],'موجودی شاسی اصلی تغییرنام‌یافته');assert.equal(out[4][1],'موجودی '+models[0].name);assert.equal(JSON.stringify(input),copy);assert.deepEqual(keys(ctx.pb1800TariffFields(out,models)),keys(out));
});
test('R1800 composed print/binding and walk-in arrays share the same identity pairing',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){const source=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  let a=source.indexOf('const h=pb1800TariffFields('),b=source.indexOf(',S=async()=>',a);assert(a>=0&&b>a);const env={pb1800TariffFields:ctx.pb1800TariffFields,pb1539Types:models,pb1539Custom:models,pb1539:{},pb1539Label:(_,fallback)=>fallback,PB1795BindingLabel:n=>n};
  const fields=vm.runInNewContext(source.slice(a,b)+';h',env);const ks=keys(fields);for(const k of ['chassis','frame','pb1539_c_model','pb1539_f_model'])assert.equal(ks[ks.indexOf(k)+1],k.startsWith('pb1539_')?'pb1789_stock_'+k.slice(7):k+'_stock');
  assert(source.includes('pb1777Fields=pb1800TariffFields(PB1437TariffFields().flatMap('));assert(source.includes('PB1800TariffTitle,{fieldKey:key,label}'));assert(source.includes('data-pb1800-key'));assert.doesNotThrow(()=>new vm.Script(source));
 }
});
test('R1800 update manifest includes final paired-column CSS and native JS checksums',()=>{
 const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-r1800-tariff-album.css'])assert.equal(m.files.find(f=>f.name===name).sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
});
