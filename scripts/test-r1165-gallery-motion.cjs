const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('dist/web/photobridge-r1163-desktop-gallery-header.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1124-photographer-desktop-header.css','utf8');
const tariff=fs.readFileSync('dist/web/photobridge-r1153-gallery-manager.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const guard=fs.readFileSync('scripts/enable-r1164-gallery-tariff-photos.mjs','utf8');

test('tariff introduction disappears without hiding editable sizes, digital price or save',()=>{
 const start=tariff.indexOf('/* R1165: free vertical space');
 assert(start>=0,'new tariff compact rules exist');
 const rule=tariff.slice(start);
 assert.match(rule,/\.clientGalleryTariffIntro\s*\{\s*display:none!important/);
 assert.match(tariff,/\.clientGalleryTariffTableScroller\{/);
 assert.match(tariff,/\.clientGalleryTariffTableFoot\{/);
 assert.match(tariff,/\.pb1164TariffDigitalPrice\{/);
});

test('gallery tab syncing skips moving-indicator span and never processes it as a button',()=>{
 assert(js.includes("[...bar.querySelectorAll(':scope > button')].forEach((button,i)=>{"));
 assert(!js.includes('[...bar.children].forEach((button,i)=>{'));
 assert(js.includes("bar.querySelectorAll(':scope > button').length!==3"));
 assert(js.includes("const activeButton=find(bar,'button.active')"));
 assert(js.includes("className='pb1164MovingIndicator'"));
});

test('tab clicks reveal visible gallery content with Store motion without layout reflow',()=>{
 const begin=js.indexOf("const changed=role!=='back'");
 const end=js.indexOf("bar.append(b);",begin);
 const click=js.slice(begin,end);
 assert(begin>=0&&end>begin);
 assert(click.includes('b.animate?.('));
 assert(click.indexOf('b.animate?.(')<click.indexOf('target.click();'),'animate mounted header button before React changes filter');
 assert(click.includes('requestAnimationFrame(()=>requestAnimationFrame(()=>{'));
 assert(click.includes("find(current,'.clientGalleryMediaPanel')"));
 assert(click.includes('content?.animate?.('));
 assert(click.includes("prefers-reduced-motion: reduce"));
 assert.match(css,/\.pb1163ManagerRow>\.pb1164MovingIndicator\{\s*bottom:4px!important/);
 assert.match(css,/\.pb1163ManagerRow>\.pb1163ManagerAction:is\(\[data-kind="all"\],\[data-kind="selected"\]\)/);
});

test('gallery motion asset cache survives all build transforms',()=>{
 for(const [file,ext] of [
  ['photobridge-r1153-gallery-manager','css'],
  ['photobridge-r1124-photographer-desktop-header','css'],
  ['photobridge-r1163-desktop-gallery-header','js']
 ]){
  assert(html.includes(file+'.'+ext+'?v=r1165'),file+' HTML cache version');
  assert(guard.includes(file+'.'+ext+'?v=r1165'),file+' build cache version');
 }
});
