'use strict';
// Full, self-contained Lab desktop source snapshot + signed-update gate.
// For unsigned CI candidates this writes source ZIP + provenance, NEVER a
// misleading unsigned update JSON. Signed promotion must use the ORIGINAL
// Ed25519 publisher key. No deployment or GitHub Release occurs here.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),
 crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const {valid,PUBLIC_KEY,newer}=require('./update-trust.cjs');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run=(command,args,options={})=>{
 const out=spawnSync(command,args,{encoding:'utf8',maxBuffer:20*1024*1024,...options});
 if(out.error||out.status!==0)throw Error('release_tool_failed:'+command+':'+(out.stderr||out.error?.message||out.status).slice(0,400));
 return out.stdout.trim();
};
function inspect(root=__dirname){
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')),
 lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
 if(!/^\d+\.\d+\.\d+$/.test(pkg.version)||lock.version!==pkg.version||lock.packages?.['']?.version!==pkg.version)
  throw Error('version_lock_mismatch');
 for(const name of ['main.cjs','main-preload.cjs','alert-window.cjs','alert-order-status.cjs','app-update.cjs',
  'app-update-main.cjs','create-update-release.cjs','update-trust.cjs','prepare-access-runtime.cjs','access-libraries.json',
  'build-installer.nsh','SOURCE-PROVENANCE.json','release-kit.cjs','.github/workflows/build-lab-104-unsigned-candidate.yml',
  'test/alert-order-status.test.cjs','test/updater.test.cjs','verified-ui-pin.json',
  'verified-ui/.pb-lab-bundle-manifest.json','verified-ui/assets/index-UIRefine-v655-r84.js']){
  if(!fs.statSync(path.join(root,name)).isFile())throw Error('required_native_source_missing:'+name);
 }
 const pin=JSON.parse(fs.readFileSync(path.join(root,'verified-ui-pin.json'),'utf8'));
 const ui=JSON.parse(fs.readFileSync(path.join(root,'verified-ui/.pb-lab-bundle-manifest.json'),'utf8'));
 require('./prepare-assets.cjs').validate(ui);
 if(pin.build!==ui.build||pin.origin!=='https://photobridge.ir')throw Error('source_ui_pin_mismatch');
 for(const entry of ui.files){
  const filename=path.join(root,'verified-ui',entry.name);
  if(!fs.statSync(filename).isFile()||digest(filename)!==entry.sha256)throw Error('source_ui_asset_mismatch:'+entry.name);
 }
 return {version:pkg.version,uiBuild:ui.build,uiFiles:ui.files.length,lockSHA256:digest(path.join(root,'package-lock.json'))};
}
function listTracked(root){
 const result=spawnSync('git',['ls-files','-z'],{cwd:root,maxBuffer:20*1024*1024});
 if(result.error||result.status!==0)throw Error('git_tracked_source_unavailable');
 return result.stdout.toString('utf8').split('\0').filter(Boolean);
}
function archiveDirectory(folder,out){
 // .NET ZipFile intentionally INCLUDES .github and dotfiles. PowerShell
 // Compress-Archive skips hidden files, so it MUST NOT be used for source.
 if(process.platform==='win32'){
  const escaped=v=>v.replaceAll("'","''");
  const cmd="Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('"+escaped(folder)+"','"+escaped(out)+"')";
  run('powershell.exe',['-NoProfile','-NonInteractive','-Command',cmd]);
 }else{
  // CI/source verification on non-Windows machines; Python stdlib preserves
  // dotfiles and avoids archive dependencies.
  const script="import os,sys,zipfile;root,out=sys.argv[1:];z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED);[(z.write(os.path.join(base,name),os.path.relpath(os.path.join(base,name),root))) for base,dirs,files in os.walk(root) for name in files];z.close()";
  run('python3',['-c',script,folder,out]);
 }
}
function verifySignedRelease(root,version){
 const manifestPath=path.join(root,'release',`PhotoBridge-Lab-Update-${version}.json`);
 if(!fs.existsSync(manifestPath))throw Error('signed_update_json_missing_use_original_publisher_key');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const exe=path.join(root,'release',`PhotoBridge-Lab-Setup-${version}-x64.exe`);
 if(!valid(manifest,PUBLIC_KEY)||manifest.version!==version||
   fs.statSync(exe).size!==manifest.size||digest(exe)!==manifest.sha256)
  throw Error('signed_update_manifest_invalid_or_exe_mismatch');
 return {name:path.basename(manifestPath),sha256:digest(manifestPath),signed:true};
}
function pack({root=__dirname,webArchive,webCommit,requireSigned=false}={}){
 const meta=inspect(root),version=meta.version;
 if(!webArchive||!webCommit||!/^[a-f0-9]{40}$/.test(webCommit)||!fs.existsSync(webArchive))
  throw Error('pinned_full_web_source_required');
 if(!newer(version,'1.0.103'))throw Error('obsolete_version_refused');
 const exe=path.join(root,'release',`PhotoBridge-Lab-Setup-${version}-x64.exe`);
 if(!fs.existsSync(exe)||fs.statSync(exe).size<10_000_000)throw Error('release_installer_missing');
 const nativeCommit=run('git',['rev-parse','HEAD'],{cwd:root});
 const output=path.join(root,'release'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'pb-full-source-'));
 const nativeRoot=path.join(temp,'native'),webRoot=path.join(temp,'web'),files=[];
 let update=null;
 try{
  fs.mkdirSync(nativeRoot,{recursive:true});fs.mkdirSync(webRoot,{recursive:true});
  for(const rel of listTracked(root)){
   const src=path.join(root,rel);
   if(!fs.existsSync(src)||!fs.statSync(src).isFile())throw Error('tracked_source_missing:'+rel);
   // All tracked native source + exact, freshly injected verified-ui bytes.
   const dst=path.join(nativeRoot,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);
   files.push({path:rel,sha256:digest(dst)});
  }
  fs.copyFileSync(webArchive,path.join(webRoot,'web-source-'+webCommit+'.zip'));
  const provenance={format:'photobridge-full-source-v1',version,generatedAt:new Date().toISOString(),
   nativeCommit,webCommit,webArchiveSHA256:digest(webArchive),uiBuild:meta.uiBuild,
   uiFiles:meta.uiFiles,packageLockSHA256:meta.lockSHA256,files};
  fs.writeFileSync(path.join(temp,'SOURCE-MANIFEST.json'),JSON.stringify(provenance,null,2)+'\n');
  // No signature fabrication: a valid JSON only exists if publisher signed it.
  if(requireSigned)update=verifySignedRelease(root,version);
  const sourceZip=path.join(output,`PhotoBridge-Lab-FullSource-${version}.zip`);
  fs.rmSync(sourceZip,{force:true});archiveDirectory(temp,sourceZip);
  const index={version,installer:path.basename(exe),installerSHA256:digest(exe),
   installerSize:fs.statSync(exe).size,sourceArchive:path.basename(sourceZip),
   sourceSHA256:digest(sourceZip),nativeCommit,webCommit,uiBuild:meta.uiBuild,
   updateJson:update?.name||null,signedUpdateManifestVerified:!!update,
   status:update?'SIGNED_MANIFEST_PREPARED_NOT_PUBLISHED':'TEST_ONLY_NO_UPDATER_JSON',
   instruction:'Never publish a test-only artifact. To activate in-app updates, issue a strictly newer version, verify the original Ed25519 signed JSON matches this EXE, and promote both through the authenticated website release workflow after operator acceptance.'};
  const indexPath=path.join(output,`PhotoBridge-Lab-ReleaseInfo-${version}.json`);
  fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
  return {sourceZip,indexPath,index};
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
}
if(require.main===module){
 try{
  const command=process.argv[2]||'inspect';
  if(command==='inspect')console.log(JSON.stringify(inspect(),null,2));
  else if(command==='verify-json')console.log(JSON.stringify(verifySignedRelease(__dirname,require('./package.json').version)));
  else if(command==='pack')console.log(JSON.stringify(pack({webArchive:process.env.PB_WEB_SOURCE_ARCHIVE,webCommit:process.env.PB_WEB_SOURCE_COMMIT,requireSigned:process.env.PB_REQUIRE_SIGNED_UPDATE==='1'}),null,2));
  else throw Error('unknown_command');
 }catch(error){console.error('STOP:',error.message);process.exitCode=1}
}
module.exports={inspect,verifySignedRelease,pack,listTracked};
