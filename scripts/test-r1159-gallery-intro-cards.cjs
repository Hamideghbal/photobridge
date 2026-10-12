const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1159-gallery-intro-cards.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const a=ui.indexOf('e.jsxs("details",{className:"clientGalleryIntro card pb1158Intro pb1159Intro"');
const b=ui.indexOf('className:"clientGalleryPolicyLine"',a);
assert(a>=0&&b>a,'gallery overview section exists');
const intro=ui.slice(a,b);
test('photographer gallery overview starts collapsed and stays blue',()=>{
 assert.doesNotMatch(intro,/open:!0/);
 assert.match(intro,/className:"pb1159IntroPreview"/);
 assert.match(intro,/… مشاهده توضیحات/);
 assert.match(intro,/className:"pb1159IntroLess"/);
 assert.match(css,/\.pb1159Intro>summary\{[\s\S]*?background:linear-gradient/);
 assert.match(css,/\.pb1159Intro \.pb1159IntroPreview\{[\s\S]*?-webkit-line-clamp:2/);
 assert.match(css,/@media\(max-width:820px\)\{[\s\S]*?-webkit-line-clamp:3/);
 assert.match(html,/photobridge-r1159-gallery-intro-cards\.css\?v=r1159/);
});
test('cost, photo ceiling and wallet remain in explanation, not separate tiles',()=>{
 assert.doesNotMatch(intro,/className:"clientGalleryIntroFacts"/);
 assert.match(intro,/className:"pb1159IntroCosts"/);
 assert.match(intro,/vi\(C\)/);
 assert.match(intro,/V\(w\)/);
 assert.match(intro,/vi\(F\)/);
});
test('all gallery-card action counts have gap-free layouts',()=>{
 assert.match(css,/\.clientGalleryCardActions:has\(>button:nth-child\(5\)\)/);
 assert.match(css,/\.clientGalleryCardActions:has\(>button:nth-child\(5\):last-child\)>button:nth-child\(n\+4\)\{grid-column:span 3/);
 assert.match(css,/\.clientGalleryCardActions>button:last-child:nth-child\(odd\)/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1159/);
});

test('gallery card uses two exact action rows with icon-only deletion',()=>{
 const at=ui.indexOf('className:"clientGalleryCardActions pb1160GalleryActions"');
 assert(at>=0,'gallery action group exists');
 const cardEnd=ui.indexOf(']})]})',at);
 assert(cardEnd>at,'gallery action rows close correctly');
 const card=ui.slice(at,cardEnd+6);
 const topAt=card.indexOf('className:"pb1161GalleryTopRow"');
 const bottomAt=card.indexOf('className:"pb1161GalleryBottomRow"');
 assert(topAt>=0&&bottomAt>topAt,'two separate action rows are present');
 const top=card.slice(topAt,bottomAt),bottom=card.slice(bottomAt);
 assert.equal(top.split('e.jsx("button"').length-1,3,'top row contains exactly three buttons');
 assert.equal(bottom.split('e.jsx("button"').length-1,2,'bottom row contains exactly two buttons');
 for(const token of ['PB1112publish(L)','onClick:()=>I(L.id)','className:"pbActionButton pb1160GalleryDelete"','aria-label":`حذف گالری','pb1113GalleryConfirm','method:"DELETE"','children:e.jsx("svg"']){
   assert.ok(top.includes(token),'missing upper action: '+token);
 }
 assert.ok(!top.includes('title:"حذف گالری"'),'no delete tooltip or visible caption');
 assert.ok(bottom.includes('children:"کپی لینک"'));
 assert.ok(bottom.includes('children:"نمایش مشتری"'));
 assert.ok(bottom.indexOf('children:"کپی لینک"')<bottom.indexOf('children:"نمایش مشتری"'));
 assert.ok(css.includes('.pb1161GalleryTopRow{'));
 assert.ok(css.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr) 42px!important'));
 assert.ok(css.includes('.pb1161GalleryBottomRow{'));
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
 assert.ok(html.includes('gallery-intro-cards.css?v=r1159&cards=r1161'));
 assert.ok(html.includes('index-UIRefine-v655-r84.js?v=r1159&cards=r1163'));
});
