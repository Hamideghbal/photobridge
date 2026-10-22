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
 assert(!lab.includes("transform:'translateY(7px)'"));
 assert(!lab.includes("transform:'translateY(5px)'"));
 assert(lab.includes("const intake=document.getElementById('pb1137LocalIntakeButton')"));
});
// R1193/R1252/R1298 can append more cache busters after R1187.
// Parse the real src query instead of incorrectly requiring motion to be last.
function assertMotionMarker(page,name){
 const srcPattern=new RegExp(name+'\\.js\\?([^"\\s]+)"','g');
 const urls=[...page.matchAll(srcPattern)];
 assert.equal(urls.length,1,name+' should be loaded exactly once');
 const params=new URLSearchParams(urls[0][1]);
 assert.deepEqual(params.getAll('motion'),['r1187'],name+' must have exactly one R1187 cache marker');
}
test('updated photo tab JS receives a unique motion cache token regardless of later version params',()=>{
 for(const name of [
  'photobridge-r1126-desktop-navigation',
  'photobridge-r1163-desktop-gallery-header',
  'photobridge-r1147-lab-admin-header'
 ])assertMotionMarker(html,name);
 assertMotionMarker(embedded,'photobridge-r1126-desktop-navigation');
});
test('newer cache params after motion do not invalidate the R1187 token',()=>{
 assertMotionMarker('<script src="/photobridge-r1126-desktop-navigation.js?v=r1249&motion=r1187&orders=r1250&layout=r1252"></script>','photobridge-r1126-desktop-navigation');
});
