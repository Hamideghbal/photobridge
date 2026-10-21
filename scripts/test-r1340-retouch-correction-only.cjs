const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1332-gallery-cards.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('initial retouch has neutral date, not a green correction badge',()=>{
 assert(!bundle.includes('e.jsx(PB1337RetouchStatus,{item:Ee'));
 assert(bundle.includes('Ee.retouch?.created_at?e.jsx("small",{className:"pb1340InitialRetouchDate"'));
 assert(bundle.includes('"تاریخ بارگذاری روتوش: "+Zn(Ee.retouch.created_at)'));
 assert(bundle.includes('Ee.openRevision?e.jsxs("div",{className:"pb1340CorrectionState "'));
 assert(css.includes('.pb1340InitialRetouchDate{display:block'));
 assert(css.includes('background:none;border:0'));
});

test('replacement upload is available only for a customer-requested correction',()=>{
 const condition=bundle.match(/\["submitted","retouching"\]\.includes\(String\(O\.status\)\)&&\(!Ee\.retouch\|\|!!Ee\.openRevision\)/);
 assert(condition,'real retouch file control must be guarded');
 const allowed=new Function('O','Ee','return '+condition[0]);
 assert.equal(allowed({status:'retouching'},{retouch:null,openRevision:null}),true,'initial upload');
 assert.equal(allowed({status:'retouching'},{retouch:{},openRevision:null}),false,'no request, no replacement');
 assert.equal(allowed({status:'retouching'},{retouch:{},openRevision:{id:'req'}}),true,'customer correction');
 assert.equal(allowed({status:'awaiting_approval'},{retouch:{},openRevision:{id:'req'}}),false,'awaiting review remains locked');
 assert(bundle.includes('if(photo?.retouch&&!photo.openRevision){window.pb1113GalleryNotice('));
 assert(!bundle.includes('"تعویض نمونه روتوش"'));
 assert(bundle.includes('Ee.openRevision?"بارگذاری اصلاحیه":"بارگذاری نمونه روتوش"'));
});

test('pending and uploaded revisions are visibly distinct from initial uploads',()=>{
 assert(bundle.includes('Ee.revisionUploaded?"✓ اصلاحیه جدید بارگذاری شد":"در انتظار بارگذاری اصلاحیه"'));
 assert(bundle.includes('Ee.revisionUploaded&&Ee.retouch?.created_at?e.jsx("small"'));
 assert(css.includes('.pb1340CorrectionState.pending{color:#9a3412'));
 assert(css.includes('.pb1340CorrectionState.uploaded{color:#067647'));
 assert(bundle.includes('revisionUploaded:!!(revision&&Number.isFinite(latest)&&Number.isFinite(requested)&&latest>requested)'));
 assert(bundle.includes('children:Ee.revisionUploaded?"نسخه اصلاح‌شده جدید":"نسخه روتوش"'));
});

test('R1338 upload progress, stable gallery refresh and current cache remain intact',()=>{
 assert(bundle.includes('className:"pb1338UploadFill"'));
 assert(bundle.includes('className:"pb1338UploadText"'));
 assert(bundle.includes('String(o?.gallery?.id||"")!==String(L)&&l(null)'));
 assert.equal((html.match(/retouchReload=r1340/g)||[]).length,2);
 assert.match(fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim(),/^2026-10-21-r1340-/);
 assert.doesNotThrow(()=>new Function(bundle),'production bundle parses');
});
