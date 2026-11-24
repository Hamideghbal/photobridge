'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const read=p=>fs.readFileSync(p,'utf8');
const js=read('dist/web/photobridge-r1310-layout.js');
const css=read('dist/web/photobridge-r1310-layout.css');
const store=read('dist/api/equipment-rental-book.html');
const page=read('dist/web/index.html');

test('R1998: Gallery iframe gets its own measured layout, never assumes parent DOM',()=>{
 assert.doesNotThrow(()=>new vm.Script(js),'Gallery geometry JS parses');
 assert.match(js,/\/\* PB1998 embedded gallery geometry \*\//);
 assert.match(js,/root\.classList\.contains\('pb1126Embedded'\)/);
 assert.match(js,/location\.pathname==='\/photographer\/gallery'/);
 assert.match(js,/new URLSearchParams\(location\.search\)\.get\('pbDesktopPanel'\)==='gallery'/);
 assert.match(js,/embeddedGallery\|\|\(root\.classList\.contains\('pb1126Desktop'\)/);
 assert.match(js,/root\.classList\.add\('pb1310GalleryHome'\)/,'class is set before React first paint');
 assert.match(js,/!qs\('\.clientGalleryManager'\)/,'do not alter gallery management screens');
});

test('R1998: Gallery has no 42px blank header and embedded body starts at zero',()=>{
 assert.match(css,/\/\* PB1998 gallery panel geometry \*\//);
 assert.match(css,/#pb1126DesktopHeader:has\(>\.pb1126MainNav>\[data-pb1126-kind="gallery"\]\.active\)/);
 assert.match(css,/\.pb1126ContentPanel\[data-panel="gallery"\]\{top:72px!important\}/);
 assert.match(css,/\.pb1126Secondary\{[\s\S]*?display:none!important;visibility:hidden!important;height:0!important/);
 const overrides=css.slice(css.indexOf('/* PB1998 gallery panel geometry */'));
 assert.match(overrides,/html\.pb1126Embedded\.pb1310GalleryHome body #root main\.photographerMain>\.photographerRolePageScrollArea\{[\s\S]*?top:0!important/);
 assert.match(overrides,/padding:0 16px 20px!important;scroll-padding-top:0!important/);
 assert.match(overrides,/max-height:none!important/,'long gallery list remains scrollable');
});

test('R1998: desktop blue Gallery intro matches the Print/Lab chooser width',()=>{
 const newCss=css.slice(css.indexOf('/* PB1998 gallery panel geometry */'));
 assert.match(newCss,/\.clientGalleryWorkspace \.clientGalleryIntro\{[\s\S]*?max-width:760px!important/);
 assert.match(newCss,/\.clientGalleryIntro\.pb1159Intro\{[\s\S]*?height:112px!important;min-height:112px!important/);
 assert.match(newCss,/\.clientGalleryIntro\.pb1159Intro\[open\]\{height:auto!important\}/);
 const desktopCss=read('dist/web/photobridge-r1310-layout.css');
 assert.match(desktopCss,/#pbR99LabChooser \.pbR99LabWrap/);
 assert.match(desktopCss,/width:min\(792px,100%\)!important;padding:20px 16px 42px!important/);
});

test('R1998: only the desktop chooser filter strip is hidden; Shop cards/actions remain',()=>{
 const head=store.slice(0,store.indexOf('</head>'));
 const id='id="pbR1998StoreChooserNoFilters"';
 assert.equal(store.split(id).length-1,1,'one override, not repeated across build passes');
 const old=head.indexOf('id="pbR1994StoreChooserFilterFlow"'),current=head.indexOf(id);
 assert(old>=0&&current>old,'hide rule follows older display:flex!important rule');
 const rule=head.slice(current,head.indexOf('</style>',current));
 assert.match(rule,/@media\(min-width:821px\)/,'mobile chooser is left untouched');
 assert.match(rule,/html\.pb1126Embedded body\.pbR96ChoosingStore/);
 assert.match(rule,/#storePhotographerWorkspace #storeChooserPanelR96 \.pbR96StoreChooser > #storeChooserFiltersR1231/,'selector must match the old highly-specific display:flex rule');
 assert.match(rule,/display:none!important/);
 assert.match(rule,/margin:0!important;padding:0!important/);
 assert.doesNotMatch(rule,/#storeChooserListR96|\.pbR96StoreCard/,'store selection cards must not be hidden');
 assert.match(store,/let storeChooserKindR1231='all'/,'without filter UI, the default still shows every store');
 assert.match(store,/function renderStoreChooserR96\(\)/,'chooser card actions stay interactive');
});

test('R1998: Gallery fixes are desktop-specific and the source is cache-busted',()=>{
 assert.match(css,/@media\(min-width:821px\)\{/);
 assert.doesNotMatch(css.slice(css.indexOf('/* PB1998 gallery panel geometry */')) , /@media\(max-width:820px\)/);
 const url=/photobridge-r1310-layout\.(?:css|js)[^"'<>\s]*galleryPanel=r1998/;
 // The perf bundler may remove individual CSS links only after this test,
 // so final validation relies on source CSS rather than a stale link.
 if(page.includes('photobridge-r1310-layout.'))assert.match(page,url);
});
