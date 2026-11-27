const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const read=p=>fs.readFileSync(p,'utf8');
test('R2070 desktop entry and independent tutorial delivery',()=>{
 const ui=read('dist/web/assets/index-UIRefine-v655-r84.js'),guide=read('dist/web/photobridge-workflow-guides-v572.js'),html=read('dist/web/index.html');
 const start=ui.indexOf('pb2070PrintEntry'),end=ui.indexOf('pb2070AddonEntry',start);
 assert(start>=0&&end>start&&end-start<1400);assert(ui.slice(start,end).includes('data-pb2070-guide":"new-print"'));
 assert(ui.includes('data-pb2070-guide":"addon-only"'));assert(ui.includes('r();pb1793SetStandalone(true)'));assert(ui.includes('PB1793AddonOnlyDialog'));assert(ui.includes('pb2044NativeProduct'));
 assert(guide.includes("key:'new-print-desktop'")&&guide.includes("key:'addon-only-desktop'"));assert(guide.includes("finance:'مالی','new-print':'چاپ عکس جدید','addon-only':'سفارش شاسی و قاب بدون چاپ'"));
 assert(html.includes('desktopEntry=r2070'));
 for(const p of ['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-workflow-guides-v572.js','dist/web/index.html'])for(const [ext,decode]of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])if(fs.existsSync(p+ext))assert(decode(fs.readFileSync(p+ext)).equals(fs.readFileSync(p)),p+ext);
});
