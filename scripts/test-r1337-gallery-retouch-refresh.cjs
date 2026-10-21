const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1332-gallery-cards.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('gallery detail is not unmounted on same-gallery upload reload',()=>{
 assert(bundle.includes('String(o?.gallery?.id||"")!==String(L)&&l(null),l(await Me('));
 assert(!bundle.includes('}catch{}l(null),l(await Me('));
 assert(bundle.includes('onReload:async()=>{const detail=await Me(`'));
});

test('new revision is identified from real proof timestamp, not old existing retouch',()=>{
 const match=bundle.match(/return\[\.\.\.we\.values\(\)\]\.map\(H=>\{const revision=.*?revisionUploaded:!!\(revision&&Number\.isFinite\(latest\)&&Number\.isFinite\(requested\)&&latest>requested\)\}\}\)/s);
 assert(match,'production bundle must derive latest correction status from proof and request dates');
 const compute=new Function('we',match[0]);
 const entry=(proofTime,requestTime,resolved=null)=>compute(new Map([['a',{
   mediaId:'a',retouch:{created_at:proofTime},
   revisions:[{id:'rev1',createdAt:requestTime,resolvedAt:resolved}]
 }]])).at(0);
 assert.equal(entry('2026-10-21T10:00:00Z','2026-10-21T11:00:00Z').revisionUploaded,false);
 assert.equal(entry('2026-10-21T12:00:00Z','2026-10-21T11:00:00Z').revisionUploaded,true);
 assert.equal(entry('2026-10-21T12:00:00Z','2026-10-21T11:00:00Z','2026-10-21T12:30:00Z').revisionUploaded,false);
});

test('photo status, retouch preview label and upload completion are visible',()=>{
 assert(bundle.includes('className:"pb1337RetouchStatus"'));
 assert(bundle.includes('نسخهٔ اصلاحی روتوش بارگذاری شد'));
 assert(bundle.includes('آخرین بارگذاری: '));
 assert(bundle.includes('children:Ee.revisionUploaded?"نسخه اصلاح‌شده جدید":"نسخه روتوش"'));
 assert(bundle.includes('PB1337setUploads(prev=>'));
 assert(bundle.includes('Ee.openRevision&&!Ee.revisionUploaded?"needsRevision":Ee.revisionUploaded?"revisionUploaded":""'));
 assert(css.includes('.clientGalleryRetouchCard.revisionUploaded'));
 assert(css.includes('.pb1337RetouchUploadState.isUpdated'));
 assert(css.includes('.pb1337RetouchUploadState.needsUpdate'));
});

test('R1337 versioned script and CSS bypass stale browser cache',()=>{
 assert(html.includes('retouchReload=r1338'));
 assert(html.includes('index-UIRefine-v655-r84.js'));
 assert.equal((html.match(/retouchReload=r1338/g)||[]).length,2);
 assert.match(fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim(),/^2026-10-21-r1338-/);
});
