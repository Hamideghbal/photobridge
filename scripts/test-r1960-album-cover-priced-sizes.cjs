// R1960 — regression contract: all priced binding models participate in cover sizes.
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const server=read('dist/api/server.js');
const start=server.indexOf('async function syncLabAlbumSizesFromPrintTariffs(');
const end=server.indexOf('\nasync function ',start+30);
assert(start>=0&&end>start,'album size sync must exist');
const sync=vm.runInNewContext('('+server.slice(start,end)+')',{
  normalizePrintCatalog:raw=>raw,
  albumMoney:value=>Math.max(0,Math.round(Number(value||0))),
  Object,Number,Math,String,Set
});
function rows(){
  return [
    ['legacy','20×30',125],
    ['custom','25×50',0],
    ['combined','30×60',0],
    ['modelCombined','35×70',0],
    ['archived','40×80',0],
    ['empty','45×90',0]
  ].map(([print_size_id,label,album_binding_price])=>({print_size_id,label,width_cm:20,height_cm:30,album_binding_price}));
}
async function scenario(mode){
 const inserts=[],queries=[],deactivated=[];
 const preferences={
   printTariffCatalog:{
     albumPricingMode:mode,
     types:[{id:'album_binding_price',kind:'binding',legacy:true,active:true},
            {id:'c_one',kind:'binding',active:true},
            {id:'c_archived',kind:'binding',active:false}],
     rates:{custom:{c_one:260},archived:{c_archived:800}},
     albumCombinedRates:{combined:{luster:350}},
     albumCombinedModelRates:{modelCombined:{c_one:{silk:450}}}
   }
 };
 const client={query:async(sql,args=[])=>{
   queries.push(sql);
   if(sql.includes('FROM print_sizes ps')){
     assert(sql.includes('LEFT JOIN lab_prices p'),'sizes without legacy price row must not disappear');
     return {rows:rows()};
   }
   if(sql==='SELECT ui_preferences FROM labs WHERE id=$1')return{rows:[{ui_preferences:preferences}]};
   if(sql.includes('SELECT id FROM lab_album_sizes'))return{rowCount:0,rows:[]};
   if(sql.startsWith('INSERT INTO lab_album_sizes')){inserts.push(args);return{rowCount:1,rows:[]}};
   if(sql.startsWith('UPDATE lab_album_sizes SET active=false')){deactivated.push(args);return{rowCount:1,rows:[]}};
   throw Error('Unexpected SQL: '+sql.slice(0,100));
 }};
 await sync(client,'lab-test');
 return {inserts,deactivated,queries,preferences};
}
test('R1960: active legacy, separate custom, combined default and combined model binding prices all expose cover sizes',async()=>{
 const {inserts,deactivated,queries}=await scenario('combined');
 assert.deepEqual(inserts.map(a=>a[1]),['legacy','custom','combined','modelCombined']);
 assert.deepEqual(deactivated[0][1],['legacy','custom','combined','modelCombined']);
 assert.equal(inserts.find(row=>row[1]==='custom')[6],0,'custom price must NOT become default binding amount');
 assert.equal(inserts.find(row=>row[1]==='combined')[6],0,'combined paper price must NOT become default binding amount');
 assert(queries.every(sql=>!sql.includes('invoice')&&!sql.includes('UPDATE lab_prices')));
});
test('R1960: archived models and combined-only tariffs are not silently enabled in separate mode',async()=>{
 const {inserts}=await scenario('separate');
 assert.deepEqual(inserts.map(a=>a[1]),['legacy','custom']);
});
test('R1960: both website and Windows pricing tables keep all active server-eligible album sizes',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert(ui.includes('/* PB1960 active album sizes include custom/combined priced bindings */'));
  assert(!ui.includes('&&Number(ne.bindingPrice||0)>0'));
  assert(!ui.includes('&&Number.isFinite(Number(size.bindingPrice))&&Number(size.bindingPrice)>0'));
  assert(!ui.includes('&&Number(s.bindingPrice)>0'));
  const html=read(root+'/index.html');
  assert.match(html,/albumSizes=r1960&labStage=r1956/,'new UI URL before last release cache key');
 }
});
