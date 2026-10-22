'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const tmp=()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb-lab-prebuilt-check-'));const web=path.join(dir,'dist/web');fs.mkdirSync(path.join(web,'assets'),{recursive:true});
for(const [name,min] of [['index.html',128],['assets/index-UIRefine-v655-r84.js',10000],['photobridge-r1137-lab-local-intake.js',1000],['photobridge-r1147-lab-admin-header.js',1000],['photobridge-r1163-desktop-gallery-header.js',1000],['photobridge-r1326-print-details.css',200],['photobridge-icon-512-v785.png',256]]){
 fs.writeFileSync(path.join(web,name),'x'.repeat(min+40));
}
fs.writeFileSync(path.join(web,'index.html'),'<div id="root"></div><script src="/assets/index-UIRefine-v655-r84.js?v=version&latest=1"></script><script src="/photobridge-r1137-lab-local-intake.js?v=latest"></script><script src="/photobridge-r1147-lab-admin-header.js?v=latest"></script>'+'x'.repeat(256));
fs.writeFileSync(path.join(web,'assets/index-UIRefine-v655-r84.js'),'lab photographer '+'x'.repeat(11000));
return {dir,web,close:()=>fs.rmSync(dir,{recursive:true,force:true})};};
test('prebuilt site is accepted, without replaying historical site transforms',async()=>{const {verifyLabPrebuiltUi}=await import('./verify-lab-prebuilt-ui.mjs');const f=tmp();try{assert.equal(verifyLabPrebuiltUi(f.dir).count,7);}finally{f.close()}});
test('missing compiled source fails closed before native packaging',async()=>{const {verifyLabPrebuiltUi}=await import('./verify-lab-prebuilt-ui.mjs');const f=tmp();try{fs.rmSync(path.join(f.web,'assets/index-UIRefine-v655-r84.js'));assert.throws(()=>verifyLabPrebuiltUi(f.dir),/missing or invalid required website asset/i)}finally{f.close()}});
test('wrong index document cannot be bundled as usable native UI',async()=>{const {verifyLabPrebuiltUi}=await import('./verify-lab-prebuilt-ui.mjs');const f=tmp();try{fs.writeFileSync(path.join(f.web,'index.html'),'<div>broken</div>'+'x'.repeat(220));assert.throws(()=>verifyLabPrebuiltUi(f.dir),/React root is missing/)}finally{f.close()}});
test('wrong auth/page script cache references cannot be shipped',async()=>{const {verifyLabPrebuiltUi}=await import('./verify-lab-prebuilt-ui.mjs');const f=tmp();try{fs.writeFileSync(path.join(f.web,'index.html'),'<div id="root"></div><script src="/assets/index-UIRefine-v655-r84.js?v=ok"></script>'+'x'.repeat(250));assert.throws(()=>verifyLabPrebuiltUi(f.dir),/Versioned Lab JS missing/)}finally{f.close()}});
test('native installer script defaults to using validated prebuilt site and verifies exact payload hashes',()=>{
 const src=fs.readFileSync('tools/build-lab-windows-local.mjs','utf8');
 assert(src.includes("run(process.execPath, ['tools/verify-lab-prebuilt-ui.mjs'])"));
 assert(src.includes("run(process.execPath, ['scripts/verify-lab-desktop-ui-freshness.mjs'])"));
 assert(src.includes("if (rebuildWebsite) {"));
 assert(src.includes("run(process.execPath, ['scripts/liara-fast-build.mjs'])"));
 assert(src.includes('if (signed && !(process.env.CSC_LINK || process.env.WIN_CSC_LINK))'));
 assert(src.includes('hash(archive) !== archiveSha256'));
 assert(src.includes('enable-r1348-lab-presence-online-only.mjs'));
 assert(src.includes('test-r1348-lab-presence-sync.cjs'));
 assert(src.includes("run(process.execPath, ['npm'])")===false);
});
