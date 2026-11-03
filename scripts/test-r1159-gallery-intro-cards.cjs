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
 // R1332 keeps all five actions in a refined primary/secondary two-row layout.
 const at=ui.indexOf('className:"clientGalleryCardActions pb1160GalleryActions pb1332Actions"');
 const end=ui.indexOf(']},L.id)',at);
 assert(at>=0&&end>at,'gallery action group exists');
 const card=ui.slice(at,end),topAt=card.indexOf('className:"pb1332PrimaryRow"'),bottomAt=card.indexOf('className:"pb1332SecondaryRow"');
 assert(topAt>=0&&bottomAt>topAt,'two separate action rows are present');
 const top=card.slice(topAt,bottomAt),bottom=card.slice(bottomAt);
 assert.equal(top.split('e.jsx("button"').length-1,2,'primary row contains manage and preview');
 assert.equal(bottom.split('e.jsx("button"').length-1,3,'secondary row contains toggle, copy and deletion');
 for(const token of ['onClick:()=>I(L.id)','children:"نمایش مشتری"'])assert(top.includes(token),token);
 for(const token of ['PB1112publish(L)','children:"کپی لینک"','className:"pbActionButton pb1160GalleryDelete"','aria-label":`حذف گالری','pb1113GalleryConfirm','method:"DELETE"','children:e.jsx("svg"'])assert(bottom.includes(token),token);
 assert(!bottom.includes('title:"حذف گالری"'),'no delete tooltip or visible caption');
 const refinedCss=fs.readFileSync('dist/web/photobridge-r1332-gallery-cards.css','utf8');
 assert.match(refinedCss,/\.pb1332PrimaryRow\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(refinedCss,/\.pb1332SecondaryRow\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\) 40px/);
 assert(html.includes('gallery-intro-cards.css?v=r1159&cards=r1161'));
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1159(?=[^"\s]*&wallet=r1238)(?=[^"\s]*&cards=r1333)/);
});
