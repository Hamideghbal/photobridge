const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const main=read('dist/web/photobridge-r1126-desktop-navigation.js');
const gallery=read('dist/web/photobridge-r1163-desktop-gallery-header.js');
const lab=read('dist/web/photobridge-r1147-lab-admin-header.js');
const html=read('dist/web/index.html');
const embedded=read('dist/api/equipment-rental-book.html');
test('photographer main tab switch keeps page content at fixed coordinates',()=>{
 const begin=main.indexOf('function reveal(el){');
 const end=main.indexOf('\n function schedule()',begin);
 assert(begin>=0&&end>begin);
 const motion=main.slice(begin,end);
 assert(motion.includes("el.animate([{opacity:.85},{opacity:1}],{duration:420"));
 assert(!motion.includes('translateY('));
 assert(main.includes("indicator.style.transform!=='translateX('"));
 assert(main.includes('function press(el){'));
});
test('gallery media tab change no longer translates photo content',()=>{
 const start=gallery.indexOf("const changed=role!=='back'");
 const end=gallery.indexOf('bar.append(b);',start);
 assert(start>=0&&end>start);
 const code=gallery.slice(start,end);
 assert(code.includes("content?.animate?.([{opacity:.85},{opacity:1}],{duration:240"));
 assert(!code.includes('translateY(7px)'));
 assert(code.includes('b.animate?.('));
 assert(gallery.includes("className='pb1164MovingIndicator'"));
});
test('lab orders and top-level tabs keep scrollable content stationary',()=>{
 assert(!lab.includes("document.querySelector('.labRolePageScrollArea')?.animate("));
 assert(lab.includes('PB1188 fixed scroll viewport; only the selected tab animates'));
 assert(!lab.includes("transform:'translateY(7px)'"));
 assert(!lab.includes("transform:'translateY(5px)'"));
 assert(lab.includes("const intake=document.getElementById('pb1137LocalIntakeButton')"));
});
test('updated photo tab JS receives new URL query parameters',()=>{
 for(const name of [
  'photobridge-r1126-desktop-navigation',
  'photobridge-r1163-desktop-gallery-header',
  'photobridge-r1147-lab-admin-header'
 ]){
  assert.match(html,new RegExp(name+'\\.js\\?v=[^"\\s]+&motion=r1187"'));
 }
 assert.match(embedded,/photobridge-r1126-desktop-navigation\.js\?v=[^"\s]+&motion=r1187"/);
});
