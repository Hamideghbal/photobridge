'use strict';
// R1992: PB_PERF_FIX_V1 intentionally replaces stylesheet <link> tags with one
// content-addressed boot CSS bundle. The approved model TWO must survive that
// operation; a missing separate link is NOT a product regression by itself.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function verifyModelTwoCssDelivery({root=process.cwd()}={}){
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const html=read('dist/web/index.html');
 const source=read('dist/web/photobridge-r1989-model2-segmented.css');
 assert.match(source,/\.pb1127PrintModes\.pb1989ModelTwo/,'approved model 2 source exists');
 const direct=/<link\b[^>]*href=["']\/photobridge-r1989-model2-segmented\.css\?v=r1989[^"']*["'][^>]*>/i.test(html);
 const bundled=html.match(/<link\b[^>]*href=["']\/assets\/(photobridge-boot-[a-f0-9]{16}\.css)["'][^>]*>/i);
 if(bundled){
  const css=read('dist/web/assets/'+bundled[1]);
  assert(css.includes(source),'the ACTUAL served boot stylesheet must contain the complete approved model 2 CSS');
  const manifest=JSON.parse(read('dist/web/assets/photobridge-boot-manifest.json'));
  assert.equal(manifest.boot,bundled[1],'HTML and boot manifest must point to the same CSS asset');
  assert(Array.isArray(manifest.sources)&&manifest.sources.some(u=>u.startsWith('/photobridge-r1989-model2-segmented.css?v=r1989')),
    'boot source manifest must list the approved model 2 CSS');
  assert.match(css,/background:var\(--pb1989-blue\)!important/,'active mode must remain blue in delivered CSS');
  assert.match(css,/\.pb1131MovingIndicator/,'the obsolete tab underline is disabled in delivered CSS');
  return {mode:'bundled',asset:bundled[1]};
 }
 assert(direct,'before PB_PERF_FIX_V1, the HTML must load the approved model 2 stylesheet directly');
 return {mode:'direct',asset:'/photobridge-r1989-model2-segmented.css'};
}
module.exports={verifyModelTwoCssDelivery};
if(require.main===module){
 const r=verifyModelTwoCssDelivery();
 console.log('[R1992] approved Model TWO CSS delivered '+r.mode+' via '+r.asset);
}
