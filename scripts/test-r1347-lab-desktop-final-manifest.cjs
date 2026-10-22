const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1347-lab-ui-'));
 const web=path.join(root,'dist/web'),out=path.join(web,'lab-desktop-ui'),native=path.join(root,'apps/lab-desktop');
 for(const dir of [web,out,native])fs.mkdirSync(dir,{recursive:true});
 const assets={'index.html':'<html>old UI</html>','styles.css':'body{color:#222}', 'desktop-overlay.js':'// overlay'};
 const files=[];
 for(const [name,value] of Object.entries(assets)){
   const src=path.join(name==='desktop-overlay.js'?native:web,name),dest=path.join(out,name);
   fs.writeFileSync(src,value);fs.writeFileSync(dest,value);
   files.push({name,url:'/lab-desktop-ui/'+name,sha256:sha(Buffer.from(value))});
 }
 files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
 const manifest={protocol:1,channel:'lab',files,build:sha(Buffer.from(JSON.stringify(files)))};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
 return {root,web,close:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('lab manifest freshness check accepts matching current UI',async()=>{
 const {verifyLabDesktopUiFreshness}=await import('./verify-lab-desktop-ui-freshness.mjs');
 const f=fixture();try{assert.equal(verifyLabDesktopUiFreshness(f.root).files,3);}finally{f.close();}
});
test('manifest hash valid but copied UI outdated after later CSS edits must fail',async()=>{
 const {verifyLabDesktopUiFreshness}=await import('./verify-lab-desktop-ui-freshness.mjs');
 const f=fixture();try{fs.writeFileSync(path.join(f.web,'styles.css'),'body{color:#359}');assert.throws(()=>verifyLabDesktopUiFreshness(f.root),/older than website file: styles.css/);}finally{f.close();}
});
test('new website JS created after payload build must also fail',async()=>{
 const {verifyLabDesktopUiFreshness}=await import('./verify-lab-desktop-ui-freshness.mjs');
 const f=fixture();try{fs.writeFileSync(path.join(f.web,'late.js'),'console.log(1)');assert.throws(()=>verifyLabDesktopUiFreshness(f.root),/payload file count differs/);}finally{f.close();}
});
test('production build regenerates lab manifest after the last UI mutation and verifies it',()=>{
 const code=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(code.lastIndexOf('await deployStep("./prepare-lab-desktop-ui.mjs")')>code.lastIndexOf('await deployStep("./enable-r1344-gallery-create-pricing.mjs")'));
 assert(code.lastIndexOf('await deployStep("./verify-lab-desktop-ui-freshness.mjs")')>code.lastIndexOf('await deployStep("./prepare-lab-desktop-ui.mjs")'));
});

test('actual bundled payload generator regenerates the late-modified website',async()=>{
 const {spawnSync}=require('node:child_process');
 const {verifyLabDesktopUiFreshness}=await import('./verify-lab-desktop-ui-freshness.mjs');
 const f=fixture();
 try{
  const {root,web}=f;
  fs.mkdirSync(path.join(root,'scripts'),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'prepare-lab-desktop-ui.mjs'),path.join(root,'scripts/prepare-lab-desktop-ui.mjs'));
  // An earlier release with old CSS must not be accepted after the last site patch.
  fs.writeFileSync(path.join(web,'styles.css'),'body{color:#new}');
  assert.throws(()=>verifyLabDesktopUiFreshness(root),/older than website file: styles.css/);
  const result=spawnSync(process.execPath,[path.join(root,'scripts/prepare-lab-desktop-ui.mjs')],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
  const parsed=verifyLabDesktopUiFreshness(root);
  assert.equal(parsed.files,3);
  assert.equal(fs.readFileSync(path.join(web,'lab-desktop-ui','styles.css'),'utf8'),'body{color:#new}');
 }finally{f.close();}
});
