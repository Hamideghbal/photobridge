'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const roots=['dist/web','dist/web/lab-desktop-ui'];
function generated(root){
 const asset=read(root+'/assets/index-UIRefine-v655-r84.js');
 const i=asset.indexOf('function Kv('),j=asset.indexOf('function ',i+12);
 assert(i>=0&&j>i,'missing album editor '+root);
 return {asset,kv:asset.slice(i,j)};
}
function resolvedFunction(asset){
 const a=asset.indexOf('function PB1864AlbumBindingId(');
 assert(a>=0,'missing helper');
 const b=asset.indexOf('\n}',a);
 assert(b>a);
 return vm.runInNewContext('('+asset.slice(a,b+2)+')');
}
test('R1864: displayed active model is the same model used by validation and order payload',()=>{
 const custom='c_12345678-1234-4123-8123-123456789abc';
 for(const root of roots){
  const {asset,kv}=generated(root),resolve=resolvedFunction(asset);
  assert.doesNotThrow(()=>new vm.Script(asset));
  const catalog={printTariffCatalog:{types:[
    {id:'album_binding_price',kind:'binding',active:false},
    {id:custom,kind:'binding',active:true,name:'صحافی فلت'},
    {id:'other',kind:'binding',active:true,name:'صحافی معمولی'},
    {id:'paper',kind:'paper',active:true}
  ]}};
  assert.equal(resolve(catalog,'album_binding_price'),custom,'archived default must resolve to visible active model');
  assert.equal(resolve(catalog,'other'),'other','explicit valid choice must be preserved');
  assert.equal(resolve({printTariffCatalog:{types:[]}},'album_binding_price'),'album_binding_price');
  assert.equal(resolve(catalog,'missing'),custom,'invalid restored id must use visible active option');
  assert(kv.includes('value:String(pb1539Chosen.id)'),'native selector must use visible option');
  assert(kv.includes('pb1539SetBinding(id)'),'user can explicitly change binding model');
  const expected='PB1864AlbumBindingId(l,pb1539Binding)';
  assert(kv.includes('ue=()=>({bindingTypeId:'+expected+',sizeId:m,'),'draft should use visible binding');
  assert(kv.includes('const b=JSON.stringify({bindingTypeId:'+expected+',sizeId:m,'),'auto-save should track visible binding');
  assert(kv.includes('albumData:{bindingTypeId:'+expected+',sizeId:Q?'),'API should receive visible binding');
  assert(kv.includes('if(!pb1539Bindings.some(gt=>String(gt.id)===String('+expected+')))return alert('),'validation must use visible binding');
  assert(!kv.includes('albumData:{bindingTypeId:pb1539Binding'),'should not submit stale default');
  assert(read(root+'/index.html').includes('albumBindingFix=r1864'),'fresh asset URL must bypass browser cache');
 }
});
test('R1864: generated Windows manifest matches changed album UI',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(read(root+'/manifest.json'));
 const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
   const row=manifest.files.find(x=>x.name===name);
   assert(row,'manifest entry missing '+name);
   assert.equal(row.sha256,hash(fs.readFileSync(root+'/'+name)),name);
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
});
