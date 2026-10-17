const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp');
const read=x=>fs.readFileSync(x,'utf8');
test('PhotoBridge PWA keeps all icon sizes as original bridge/aperture brand assets',async()=>{
 const manifest=JSON.parse(read('dist/web/photobridge.webmanifest'));
 assert.equal(manifest.background_color,'#040e1a');
 for(const size of [192,512]){
  const icon=manifest.icons.find(x=>x.sizes===size+'x'+size);
  assert(icon?.src.endsWith('-r1284.png')&&icon.purpose.includes('maskable'));
  const path='dist/web/'+icon.src.split('/').pop();
  assert(fs.existsSync(path),'generated '+path+' missing');
  const meta=await sharp(path).metadata();assert.equal(meta.width,size);assert.equal(meta.height,size);
 }
 assert(read('dist/web/photobridge-icon-brand-r1222.svg').includes('#2674ff'));
});
test('installed app preserves its original logo without a second web splash',()=>{
 const home=read('dist/web/index.html');assert(!home.includes('id="pbAppSplashV780"'));assert(!home.includes('src="/photobridge-script-r1278.svg"'));assert(home.includes('id="pbR1284LaunchStyle"'));assert(home.includes('/photobridge.webmanifest?v=r1284'));assert(home.includes('/photobridge-original-touch-r1284.png'));
});
test('PWA header normalization is idempotent to prevent MutationObserver flashing',()=>{
 const pwa=read('dist/web/photobridge-pwa-v703.js');
 assert(pwa.includes('if(keep.firstElementChild!==label||keep.childElementCount!==1)keep.replaceChildren(label)'));
 assert(pwa.includes('if(order.some((node,i)=>tail[i]!==node))order.forEach(node=>row.appendChild(node))'));
});
test('frame customer page caches and PWA manifest use the latest revisions',()=>{
 const portal=read('dist/api/equipment-rental-book.html');
 assert(portal.includes('frame-store.js?v=r1242-bank-payments'));
 assert(portal.includes('photobridge-r1225-store-chooser.css?v=r1231-compact-categories'));
 assert(portal.includes('frame-catalog.js?v=r1260'));
 assert(portal.includes('photobridge.webmanifest?v=r1284'));
});
