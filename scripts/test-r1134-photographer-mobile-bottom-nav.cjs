const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('dist/web/photobridge-r1132-photo-copies-mobile.css');
const navSource=read('dist/web/assets/index-UIRefine-v655-r84.js');
const build=read('scripts/enable-r1132-final-assets.mjs');
const index=read('dist/web/index.html');
const store=read('dist/api/equipment-rental-book.html');

test('mobile photographer bottom navigation overrides legacy three-column grid with one flex row',()=>{
 const pos=css.lastIndexOf('/* R1134:');
 assert.ok(pos>0,'last mobile override must exist');
 const active=css.slice(pos);
 assert.match(active,/@media\(max-width:820px\)/);
 assert.match(active,/\[aria-label="ناوبری اصلی عکاس"\]/);
 assert.match(active,/not\(\.labBottomAppNav\)/,'do not affect lab navigation');
 assert.match(active,/display:flex!important/);
 assert.match(active,/flex-direction:row!important/);
 assert.match(active,/flex-wrap:nowrap!important/);
 assert.match(active,/flex:1 1 0!important/,'all available buttons share width equally');
 assert.match(active,/button\[data-pb1099-hidden="1"\]/);
 assert.match(active,/display:none!important/,'disabled destinations stay hidden');
 assert.ok(navSource.includes('aria-label":"ناوبری اصلی عکاس"'),'matches actual React nav markup');
 assert.ok(navSource.includes('mobileRailPrimaryGroup photographerBottomAppNavGrid'));
});

test('build preserves existing desktop nav and provides R1134 CSS on both entrypoints',()=>{
 for(const entry of [index,store]){
  assert.equal((entry.match(/photobridge-r1132-photo-copies-mobile\.css\?v=r1134/g)||[]).length,1);
  assert.ok(entry.includes('photobridge-r1126-desktop-navigation.css?v=r1241-desktop-viewport-single-header'));
  assert.ok(entry.includes('photobridge-r1126-desktop-navigation.js?v=r1241-desktop-viewport-single-header'));
 }
 assert.ok(build.includes('photobridge-r1132-photo-copies-mobile.css?v=r1134'));
 assert.ok(build.includes("html=html.replace(navigationPattern,'$1r1241-desktop-viewport-single-header')"));
 assert.ok(build.includes("html=html.replace(modulePattern,'$1r1158')"));
});
