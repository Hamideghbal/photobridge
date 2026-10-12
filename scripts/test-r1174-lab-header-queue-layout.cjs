const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8');
const js=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const build=fs.readFileSync('scripts/enable-r1147-lab-admin-header.mjs','utf8');
const patch=css.slice(css.indexOf('/* R1174 —'));

test('desktop lab header type shrinks and native Store bar shadow is used',()=>{
 assert(patch.length>2000);
 assert.match(patch,/gap:clamp\(13px,1\.28vw,20px\)!important/);
 assert.match(patch,/font:800 11px\/1\.4 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(patch,/\.workspaceIdentityCopy h1\{\s*font-size:16px!important/);
 assert.match(patch,/box-shadow:0 5px 14px rgba\(15,23,42,\.055\)!important/);
 assert.match(patch,/\.pb1148SecondaryHeader::after\{\s*content:none!important;display:none!important/);
 assert.match(patch,/\.pb1148SecondaryHeader>button\[data-pb1173-index\]\{\s*font:800 11px/);
});

test('laboratory scrollbars reserve no gutter when there is no scrollable content',()=>{
 assert.match(patch,/\.labRolePageScrollArea,\s*html body #root \.labRoleWorkspace \.labOrderScrollArea\{\s*overflow-y:auto!important;scrollbar-gutter:auto!important/);
 assert.match(patch,/scrollbar-gutter:auto!important;scrollbar-width:none!important/);
});

test('lab print and album second header puts real walk-in action right and status controls left',()=>{
 assert.match(js,/source\.classList\.contains\('mainQueueFilters'\)/);
 assert.match(js,/album\(\?:s\|\[-\/\]\|\$\)/);
 assert(js.includes("row.classList.toggle('pb1174QueueNav',isQueue)"));
 assert(js.includes("intake.textContent='ثبت سفارش عکس حضوری'"));
 assert(js.includes("document.getElementById('pb1137LocalIntakeButton')?.click()"));
 assert(js.includes("row.prepend(intake)"));
 assert.match(patch,/\.pb1148SecondaryHeader\.pb1174QueueNav>button\.pb1174QueueLaunch\{/);
 assert.match(patch,/order:-1!important/);
 assert.match(patch,/margin-inline-end:auto!important/);
 assert.match(patch,/\.pb1148SecondaryHeader\.pb1174QueueNav>button\[data-pb1173-index\]/);
});

test('the entire old search/status row below header is removed with no blank space',()=>{
 assert.match(patch,/\.stageQueueWorkspace\.compactStageQueue>\.labQueueStickyBar\.quickAccessAlwaysOpen,/);
 assert.match(patch,/\.labQueueSearchSlot\{\s*display:none!important/);
 assert.match(patch,/\.stageQueueWorkspace\.compactStageQueue\{\s*padding-top:0!important;margin-top:0!important/);
 assert.match(patch,/#pb1137LocalIntakeButton\{\s*display:none!important/);
 assert.match(patch,/\.pb1148SecondaryHeader\.pb1174QueueNav>button\.pb1174QueueLaunch\[hidden\]\{\s*display:none!important/);
});

test('the three status tabs get only selected color and no underline or box',()=>{
 assert.match(patch,/\.pb1148SecondaryHeader\.pb1174QueueNav>button\[data-pb1173-index\]\{[\s\S]*?background:transparent!important;border:0!important;[\s\S]*?border-bottom:0!important/);
 assert.match(patch,/\.pb1148SecondaryHeader\.pb1174QueueNav>button\[data-pb1173-index\]::before,/);
 assert.match(patch,/content:none!important;display:none!important/);
 assert.match(patch,/\.pb1148SecondaryHeader\.pb1174QueueNav>\.pb1173MovingIndicator\{\s*opacity:0!important;display:none!important/);
 assert(js.includes("row.classList.contains('pb1174QueueNav')?null:"));
});

test('mobile remains unaffected and R1174 survives production build',()=>{
 assert.match(patch,/@media \(min-width:821px\) and \(hover:hover\) and \(pointer:fine\)/);
 for(const ext of ['css','js']){
  const name='photobridge-r1147-lab-admin-header.'+ext+'?v=r1174';
  assert(html.includes(name),name);
  assert(build.includes(name),name);
 }
 assert(build.includes('test-r1174-lab-header-queue-layout.cjs'));
});
