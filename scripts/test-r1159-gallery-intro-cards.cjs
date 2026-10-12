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

test('gallery card has three top actions and two equal bottom actions with working trash confirmation',()=>{
 const at=ui.indexOf('className:"clientGalleryCardActions pb1160GalleryActions"');
 assert(at>=0,'new gallery card action group is present');
 const card=ui.slice(at,ui.indexOf(']})',at));
 const positions=[
  'onClick:()=>PB1112publish(L)',
  'onClick:()=>I(L.id)',
  'className:"pbActionButton pb1160GalleryDelete"',
  'children:"کپی لینک"',
  'children:"نمایش مشتری"'
 ].map(x=>card.indexOf(x));
 assert(positions.every(n=>n>=0),'all five gallery actions render');
 assert(positions.every((n,i)=>i===0||n>positions[i-1]),'publish, manage, delete, copy and preview are in the requested order');
 assert.match(card,/aria-label":`حذف گالری \$\{L\.title\}`/);
 assert.match(card,/pb1113GalleryConfirm/);
 assert.match(card,/method:"DELETE"/);
 assert.match(card,/children:e\.jsx\("svg"/);
 assert.match(css,/\.pb1160GalleryActions:has\(>button:nth-child\(5\):last-child\)/);
 assert.match(css,/grid-template-columns:repeat\(14,minmax\(0,1fr\)\)/);
 assert.match(css,/>button:nth-child\(-n\+2\)\{[\s\S]*?grid-column:span 6/);
 assert.match(css,/>button:nth-child\(3\)\{[\s\S]*?grid-column:span 2/);
 assert.match(css,/>button:nth-child\(n\+4\)\{[\s\S]*?grid-column:span 7/);
 assert.match(html,/gallery-intro-cards\.css\?v=r1159&cards=r1160/);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1159&cards=r1160/);
});
