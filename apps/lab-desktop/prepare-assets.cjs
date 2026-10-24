'use strict';
// Freeze the current *server-verified* Lab UI into every newly built installer.
// On first launch, main.cjs still checks the server BEFORE opening the login.
// Never emit a release based on unverified or partially downloaded UI assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const MAX_FILE_BYTES=20_000_000, MAX_FILES=2000;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const root=__dirname;
function validate(manifest){
 if(manifest?.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files)||manifest.files.length<1||manifest.files.length>MAX_FILES)throw Error('invalid_ui_manifest');
 if(!/^[a-f0-9]{64}$/.test(manifest.build)||digest(JSON.stringify(manifest.files))!==manifest.build)throw Error('ui_manifest_hash_mismatch');
 const names=new Set();
 for(const entry of manifest.files){
  const name=entry?.name;
  if(typeof name!=='string'||!/^[a-zA-Z0-9_./-]+$/.test(name)||name.startsWith('/')||name.includes('..')||names.has(name)||entry.url!=='/lab-desktop-ui/'+name||!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('invalid_update_path');
  names.add(name);
 }
 if(!names.has('index.html')||!names.has('desktop-overlay.js'))throw Error('required_lab_asset_missing');
}
async function response(url,timeout=20000){
 let last;for(let attempt=1;attempt<=3;attempt++){try{const res=await fetch(url,{signal:AbortSignal.timeout(timeout),redirect:'error',headers:{'Cache-Control':'no-cache','Pragma':'no-cache'}});if(!res.ok)throw Object.assign(Error('ui_http_'+res.status),{status:res.status});return res}catch(e){last=e;if(e.status&&e.status<500)throw e;if(attempt<3)await new Promise(r=>setTimeout(r,attempt*250))}}
 throw Error('ui_fetch_failed: '+url.origin+url.pathname+' · '+(last?.cause?.code||last?.code||last?.name||'network_error')+' · '+last.message);
}
function copyPinnedUi({source,pinFile,staging,origin}){
 const pin=JSON.parse(fs.readFileSync(pinFile,'utf8')),manifest=JSON.parse(fs.readFileSync(path.join(source,'.pb-lab-bundle-manifest.json'),'utf8'));validate(manifest);
 if(pin.origin!==new URL(origin).origin||pin.build!==manifest.build)throw Error('pinned_ui_identity_mismatch');
 const base=fs.realpathSync(source);for(const item of manifest.files){const file=path.join(source,item.name),real=fs.realpathSync(file);if(!real.startsWith(base+path.sep)||!fs.lstatSync(file).isFile())throw Error('pinned_ui_unsafe_file:'+item.name);const stat=fs.statSync(file);if(stat.size>MAX_FILE_BYTES)throw Error('ui_asset_too_large:'+item.name);const bytes=fs.readFileSync(file);if(digest(bytes)!==item.sha256)throw Error('pinned_ui_hash_mismatch:'+item.name);const dest=path.join(staging,item.name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes)}
 fs.writeFileSync(path.join(staging,'.pb-lab-bundle-manifest.json'),JSON.stringify(manifest));return manifest;
}
async function buildBundledUi({origin=process.env.PB_LAB_UI_ORIGIN||'https://photobridge.ir',directory=path.join(root,'runtime'),offline=process.env.PB_LAB_PREPARE_OFFLINE==='1',log=console.log,pinnedDirectory=path.join(root,'verified-ui'),pinFile=path.join(root,'verified-ui-pin.json'),refresh=process.env.PB_LAB_REFRESH_UI==='1'}={}){
 const staging=directory+'.staging-'+process.pid;
 fs.rmSync(staging,{recursive:true,force:true});fs.mkdirSync(staging,{recursive:true});
 try{
  if(offline){
   const source=path.resolve(root,'../../dist/web');
   if(!fs.existsSync(path.join(source,'index.html')))throw Error('offline_dist_web_missing');
   fs.cpSync(source,staging,{recursive:true,filter:p=>!['desktop-ui','lab-desktop-ui','downloads'].includes(path.basename(p))});
   fs.copyFileSync(path.join(root,'desktop-overlay.js'),path.join(staging,'desktop-overlay.js'));
   log('[Lab Installer] Developer-only offline UI bundle (not a fresh release)');
  }else{
   const url=new URL(origin);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('invalid_ui_server_origin');
   if(!refresh&&url.origin==='https://photobridge.ir'&&fs.existsSync(pinnedDirectory)&&fs.existsSync(pinFile)){
    const manifest=copyPinnedUi({source:pinnedDirectory,pinFile,staging,origin});log('[Lab Installer] Using '+manifest.files.length+' bundled UI files; all server hashes verified ('+manifest.build.slice(0,12)+'). No site download required.');
   }else{
   let manifest,lastError;
   for(const endpoint of ['/api/desktop-ui/lab-manifest','/api/lab/desktop-ui-manifest']){
    try{manifest=await (await response(new URL(endpoint,url))).json();break}catch(e){lastError=e}
   }
   if(!manifest)throw lastError||Error('ui_manifest_unavailable');
   validate(manifest);
   log('[Lab Installer] Verifying '+manifest.files.length+' Lab UI files ('+manifest.build.slice(0,12)+')');
   let index=0,done=0,failed=null;
   async function worker(){
    while(!failed){
     const item=manifest.files[index++];if(!item)return;
     try{
      const r=await response(new URL(item.url,url),30000);
      const length=Number(r.headers.get('content-length'));
      if(Number.isFinite(length)&&length>MAX_FILE_BYTES)throw Error('ui_asset_too_large:'+item.name);
      const raw=Buffer.from(await r.arrayBuffer());
      if(raw.length>MAX_FILE_BYTES)throw Error('ui_asset_too_large:'+item.name);
      if(digest(raw)!==item.sha256)throw Error('ui_asset_hash_mismatch:'+item.name);
      const dest=path.resolve(staging,item.name);
      if(!dest.startsWith(path.resolve(staging)+path.sep))throw Error('invalid_update_path');
      fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,raw);
      done++;if(done%100===0||done===manifest.files.length)log('[Lab Installer] Verified '+done+'/'+manifest.files.length);
     }catch(e){failed=e}
    }
   }
   await Promise.all(Array.from({length:Math.min(6,manifest.files.length)},()=>worker()));
   if(failed)throw failed;
   fs.writeFileSync(path.join(staging,'.pb-lab-bundle-manifest.json'),JSON.stringify(manifest));
   }
  }
  const previous=directory+'.previous-build';
  fs.rmSync(previous,{recursive:true,force:true});
  if(fs.existsSync(directory))fs.renameSync(directory,previous);
  try{fs.renameSync(staging,directory);}catch(e){if(fs.existsSync(previous))fs.renameSync(previous,directory);throw e}
  fs.rmSync(previous,{recursive:true,force:true});
  fs.writeFileSync(path.join(root,'release-config.json'),JSON.stringify({signed:!!(process.env.CSC_LINK||process.env.WIN_CSC_LINK)}));
  return directory;
 }catch(e){fs.rmSync(staging,{recursive:true,force:true});throw e}
}
if(require.main===module)buildBundledUi().catch(e=>{console.error('[Lab Installer] Verified UI preparation failed; installer NOT built:',e.message);process.exitCode=1});
module.exports={buildBundledUi,validate,copyPinnedUi};
