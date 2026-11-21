const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {buildBundledUi,assertCurrentLabUi}=require('../prepare-assets.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const currentBundle=[
 'function pb1936RecreateNativeDir(root,stored) {}',
 '/* PB1943 legacy-folder retry */',
 'async function pb1550Target(){}',
 "return source==='walkin'?'Moshtari':'Hamkar'",
 'const pb1894ReadyResult=await It(le,"ready")',
 '/* PB1894 invoice-first server stages */',
 'r1955Host?bi.createPortal(e.jsx("section",{className:"r1955ThirdHeader"',
 'main.insertBefore(host,scroll)'
].join('\\n');
const currentHtml='<html>verified website<style>/* PB1949: stable Lab toolbar */</style><style id="pb1955-real-third-header">/* PB1955: real third header */</style><script src="/assets/index-UIRefine-v655-r84.js?labStage=r1955"></script></html>';
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-pinned-')),source=path.join(root,'verified'),directory=path.join(root,'runtime'),pinFile=path.join(root,'pin.json');
 fs.mkdirSync(path.join(source,'assets'),{recursive:true});
 function pin(){
  const files=['index.html','desktop-overlay.js','assets/index-UIRefine-v655-r84.js'].map(name=>({
   name,url:'/lab-desktop-ui/'+name,sha256:hash(fs.readFileSync(path.join(source,name)))}));
  const manifest={protocol:1,channel:'lab',files,build:hash(JSON.stringify(files))};
  fs.writeFileSync(path.join(source,'.pb-lab-bundle-manifest.json'),JSON.stringify(manifest));
  fs.writeFileSync(pinFile,JSON.stringify({origin:'https://photobridge.ir',build:manifest.build}));
  return manifest;
 }
 fs.writeFileSync(path.join(source,'index.html'),currentHtml);
 fs.writeFileSync(path.join(source,'desktop-overlay.js'),'verified overlay');
 fs.writeFileSync(path.join(source,'assets/index-UIRefine-v655-r84.js'),currentBundle);
 const manifest=pin();
 return {root,source,directory,pinFile,manifest,pin,close:()=>fs.rmSync(root,{recursive:true,force:true}),options(){return {origin:'https://photobridge.ir',directory,pinnedDirectory:source,pinFile,log(){}}}};
}
test('all pinned website files are verified and bundled without any network request',async()=>{const f=setup(),original=global.fetch;let network=0;global.fetch=async()=>{network++;throw Error('offline')};try{await buildBundledUi(f.options());assert.equal(network,0);assert.equal(JSON.parse(fs.readFileSync(path.join(f.directory,'.pb-lab-bundle-manifest.json'))).build,f.manifest.build);assert.equal(fs.readFileSync(path.join(f.directory,'index.html'),'utf8'),currentHtml)}finally{global.fetch=original;f.close()}});
test('tampered pinned asset is rejected while the previous runtime remains intact',async()=>{const f=setup();try{fs.mkdirSync(f.directory);fs.writeFileSync(path.join(f.directory,'keep'),'previous');fs.writeFileSync(path.join(f.source,'desktop-overlay.js'),'tampered');await assert.rejects(buildBundledUi(f.options()),/pinned_ui_hash_mismatch/);assert.equal(fs.readFileSync(path.join(f.directory,'keep'),'utf8'),'previous')}finally{f.close()}});
test('manifest or pin changes cannot replace a verified runtime',async()=>{const f=setup();try{fs.writeFileSync(f.pinFile,JSON.stringify({origin:'https://photobridge.ir',build:'0'.repeat(64)}));await assert.rejects(buildBundledUi(f.options()),/pinned_ui_identity_mismatch/);fs.writeFileSync(path.join(f.source,'.pb-lab-bundle-manifest.json'),JSON.stringify({...f.manifest,build:'0'.repeat(64)}));await assert.rejects(buildBundledUi(f.options()),/ui_manifest_hash_mismatch/)}finally{f.close()}});
test('missing pinned files fail safely rather than packaging an incomplete copy',async()=>{
 const f=setup(),original=global.fetch;
 global.fetch=async()=>{throw Error('offline')};
 try{
  fs.unlinkSync(path.join(f.source,'index.html'));
  await assert.rejects(buildBundledUi(f.options()),/ui_fetch_failed|offline/);
  assert.equal(fs.existsSync(f.directory),false);
 }finally{global.fetch=original;f.close()}
});
test('stale previously pinned installer UI is rejected, including old folder names and old stage gate',()=>{
 const f=setup();
 try{
  assertCurrentLabUi(f.source);
  const file=path.join(f.source,'assets/index-UIRefine-v655-r84.js');
  fs.writeFileSync(file,currentBundle.replace("?'Moshtari':'Hamkar'","?'MOSHTARI':'HAMKAR'"));
  assert.throws(()=>assertCurrentLabUi(f.source),/stale_pinned_lab_ui/);
  fs.writeFileSync(file,currentBundle.replace('const pb1894ReadyResult=await It(le,"ready")',''));
  assert.throws(()=>assertCurrentLabUi(f.source),/stale_pinned_lab_ui/);
  fs.writeFileSync(file,currentBundle.replace('main.insertBefore(host,scroll)',''));
  assert.throws(()=>assertCurrentLabUi(f.source),/stale_pinned_lab_ui_missing_r1955_portal/);
  fs.writeFileSync(file,currentBundle);
  fs.writeFileSync(path.join(f.source,'index.html'),currentHtml.replace('labStage=r1955','labStage=r1936'));
  assert.throws(()=>assertCurrentLabUi(f.source),/stale_pinned_lab_ui_before_r1955/);
 }finally{f.close()}
});
test('a stale but hash-valid pinned UI is refreshed from latest verified server files',async()=>{
 const f=setup(),original=global.fetch;
 try{
  // Old pinned source passes SHA-256, but not the required runtime behavior.
  fs.writeFileSync(path.join(f.source,'assets/index-UIRefine-v655-r84.js'),'old bundled application');
  f.pin();
  const remoteFiles=[
   ['index.html',currentHtml],
   ['desktop-overlay.js','verified overlay'],
   ['assets/index-UIRefine-v655-r84.js',currentBundle]
  ];
  const files=remoteFiles.map(([name,body])=>({name,url:'/lab-desktop-ui/'+name,sha256:hash(body)}));
  const manifest={protocol:1,channel:'lab',files,build:hash(JSON.stringify(files))};
  const bytes=new Map(remoteFiles.map(([name,body])=>['/lab-desktop-ui/'+name,Buffer.from(body)]));
  const fetched=[];
  global.fetch=async (url)=>{
   const loc=new URL(url),pathname=loc.pathname;
   fetched.push(pathname);
   if(pathname==='/api/desktop-ui/lab-manifest')return {ok:true,json:async()=>manifest};
   if(bytes.has(pathname))return {ok:true,headers:new Headers(),arrayBuffer:async()=>bytes.get(pathname)};
   throw Error('unexpected '+pathname);
  };
  await buildBundledUi(f.options());
  assert(fetched.includes('/api/desktop-ui/lab-manifest'));
  assertCurrentLabUi(f.directory);
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.directory,'.pb-lab-bundle-manifest.json'))).build,manifest.build);
 }finally{global.fetch=original;f.close()}
});

