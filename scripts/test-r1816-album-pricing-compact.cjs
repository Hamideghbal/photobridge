
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const helper=read('scripts/r1816-album-binding-modal.js.txt');
const legacy=read('scripts/r1811-album-binding-modal.js.txt');
const a=helper.indexOf('function pb1816DigitsOnly(');
const b=helper.indexOf('function PB1811AlbumBindingPriceModal(',a);
assert(a>=0&&b>a);
const money=vm.runInNewContext(helper.slice(a,b)+'\n({only:pb1816DigitsOnly,group:pb1816GroupedMoney})');
test('R1816: input prices are grouped by thousands but remain raw decimal digits for API',()=>{
 assert.equal(money.group(''), '');
 assert.equal(money.group(null), '');
 assert.equal(money.group(50), '50');
 assert.equal(money.group(1200), '1,200');
 assert.equal(money.group('1234567890'), '1,234,567,890');
 assert.equal(money.group('۱٬۲۳۴٬۵۶۷'), '1,234,567');
 assert.equal(money.group('١٢٣٤٥٦٧'), '1,234,567');
 assert.equal(money.only('1,234,567'), '1234567');
 assert.equal(money.only('۹,۰۰۰,۰۰۰'), '9000000');
 assert.equal(money.only('٠٠٠١٢٣'), '000123');
 assert.equal(Number(money.only('1,234,567')),1234567);
 assert.equal(helper.includes('value:pb1816GroupedMoney(draft['),true);
 assert.equal(helper.includes('onChange:ev=>update(String(row.id),combined?key:"price",pb1816DigitsOnly(ev.target.value))'),true);
 assert.equal(helper.includes('if(!Number.isSafeInteger(n)||n<0||n>9000000000)'),true);
});
test('R1816: pricing method is in compact header, model chips in right-hand footer, rates fill center',()=>{
 assert.doesNotThrow(()=>new vm.Script(helper));
 assert(helper.includes('className:"pb1816ModalHeader"')||helper.includes('className:"pb1810AlbumModalHead pb1816ModalHeader"'));
 const head=helper.indexOf('className:"pb1816HeaderMode"');
 const table=helper.indexOf('className:"pb1810AlbumModalScroll"');
 const bottom=helper.indexOf('className:"pb1816FooterModels"');
 const actions=helper.indexOf('className:"pb1816FooterActions"');
 assert(head>0&&table>head&&bottom>table&&actions>bottom);
 assert(!helper.includes('className:"pb1811ModeBar"'));
 assert(!helper.includes('className:"pb1811ModelBar"'));
 assert(!helper.includes('className:"pb1811ModelToolsBottom"'));
 const css=read('dist/web/photobridge-r1816-album-pricing-compact.css');
 for(const anchor of ['.pb1816ModalHeader','.pb1816HeaderMode','.pb1816FooterModels',
  '.pb1816FooterActions','.pb1816ModalFooter','.pb1816ModelUnit','.pb1816ModelRemove'])
  assert(css.includes(anchor),anchor+' styling required');
 assert(css.includes('direction:rtl!important'));
 assert(css.includes('justify-content:space-between!important'));
 assert(css.includes('overflow-x:auto!important'));
 assert(css.includes('flex:1 1 auto!important'),'table remains scrollable and receives unused height');
 assert(legacy.includes('className:"pb1811ModelBar"'),'older tests preserve source for preceding step');
});
test('R1816: × archives only selected custom binding and retains old invoices / tariffs',()=>{
 assert(helper.includes('onClick:()=>action("archive",String(t.id))'));
 assert(helper.includes('String(t.id)!=="album_binding_price"&&e.jsx("button"'));
 assert(helper.includes('if(kind==="archive"&&resolvedId==="album_binding_price")return;'));
 assert(helper.includes('const target=models.find(t=>String(t.id)===String(targetId))||model;'));
 assert(helper.includes('const body=create?{kind:"binding",name,allowCombinedModel:true}:kind==="rename"?{id:resolvedId,name}:{id:resolvedId,active:false};'));
 assert(helper.includes('kind==="archive"&&String(chosen)===resolvedId'));
 assert(helper.includes('قیمت‌ها و سفارش‌های قبلی حفظ می‌شوند.'));
 assert(helper.includes('onClick:()=>action("create")'),'model create remains available in both modes');
 assert(helper.includes('value:mode'),'combined/separate mode remains selectable');
 assert(helper.includes('const source=audience==="walkin"?catalog.walkinAlbumBindingRates:catalog.rates;'));
 assert(helper.includes('if(combined)return pb1811AlbumPaperPrices(catalog,audience,id,modelId)[key];'));
});
test('R1816: web and Windows have byte-for-byte equivalent current modal and hot-update manifest',()=>{
 const css=read('dist/web/photobridge-r1816-album-pricing-compact.css');
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=read(root+'/assets/index-UIRefine-v655-r84.js');
  assert.doesNotThrow(()=>new vm.Script(js));
  assert.equal(js.split(helper).length-1,1,root+' exact updated modal once');
  assert.equal(js.split(legacy).length-1,0,root+' no stale duplicate modal');
  assert.equal(read(root+'/photobridge-r1816-album-pricing-compact.css'),css);
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1816-album-pricing-compact.css?v=r1816'));
  assert(html.includes('albumModal=r1816'));
 }
 const native='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(read(native+'/manifest.json'));
 for(const file of ['assets/index-UIRefine-v655-r84.js','photobridge-r1816-album-pricing-compact.css','index.html']){
  const entry=manifest.files.find(f=>f.name===file);
  assert(entry,file+' not in Windows hot manifest');
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+file)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
