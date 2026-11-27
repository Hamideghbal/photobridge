const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const read=p=>fs.readFileSync(p,'utf8');
test('R2070 desktop entry and independent tutorial delivery',()=>{
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js'),guide=read('dist/web/photobridge-workflow-guides-v572.js'),html=read('dist/web/index.html');
 const start=ui.indexOf('pb2070PrintEntry'),end=ui.indexOf('pb2070AddonEntry',start);
 assert(start>=0&&end>start&&end-start<1400);assert(ui.slice(start,end).includes('data-pb2070-guide":"new-print"'));
 assert(ui.includes('data-pb2070-guide":"addon-only"'));assert(ui.includes('r();pb1793SetStandalone(true)'));assert(ui.includes('PB1793AddonOnlyDialog'));assert(ui.includes('pb2044NativeProduct'));
 assert(guide.includes("key:'new-print-desktop'")&&guide.includes("key:'addon-only-desktop'"));assert(guide.includes("finance:'مالی','new-print':'چاپ عکس جدید','addon-only':'سفارش شاسی و قاب بدون چاپ'"));
 for(const asset of ['index-UIRefine-v655-r84.js','photobridge-workflow-guides-v572.js']){
  const re=new RegExp(asset.replaceAll('.','[.]')+'\\?[^"\\x27<>\\s]+','g');
  const urls=[...html.matchAll(re)];assert.equal(urls.length,1,asset);
  const params=new URL(urls[0][0],'https://photobridge.ir/').searchParams;
  assert.deepEqual(params.getAll('desktopEntry'),['r2071'],asset);
  assert.deepEqual(params.getAll('desktopEntryStyle'),['r2075'],asset);
  if(asset.startsWith('index-'))assert.match(urls[0][0],/&labPrintFinance=r2047&labStatement=r2048&labFinanceCache=r2049&albumSizes=r1960&labStage=r1956$/,'desktop guide must not break the Lab cache chain');
 }
 const composer=ui.slice(ui.indexOf('function ej('),ui.indexOf('function vh(',ui.indexOf('function ej(')));
 assert(!composer.includes('className:"pb1793StandaloneLaunch"'));
 assert(composer.includes('className:"pb2075ComposerBack"')&&composer.includes('onClick:pb2075Back'));
 assert(composer.includes('await PB1854persist.current')&&composer.includes('target.pathname="/photographer/orders/flow"'));
 assert(composer.includes('className:"pb2044NativeProduct"'),'mobile action retained');
 assert(guide.includes('.pb2071SecondaryPair{background:#fff!important;border-color:#cdd9ec!important;color:#24416b!important}'));
 assert(!guide.includes('.pb2071PrimaryPair{background:#3b82f6'));
 assert(ui.includes('pb2071EntryPair')&&ui.includes('pb2071GuidePlay')&&ui.includes('pb2071GuideLabel')&&ui.includes('children:"راهنما"'));
 assert(guide.includes('top:6px!important;bottom:6px!important;width:1px!important')&&guide.includes('flex-direction:column!important')&&guide.includes('display:contents!important'));
 for(const p of ['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-workflow-guides-v572.js','dist/web/index.html'])for(const [ext,decode]of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(p+ext))assert(decode(fs.readFileSync(p+ext)).equals(fs.readFileSync(p)),p+ext);
});
