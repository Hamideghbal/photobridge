'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function adoptEmbeddedUi({store,bundled,version,validate=require('./verify-native-ui.cjs').validateNativeUi}){
 // The unsigned LAB104 candidates intentionally share the same version
 // number. Version-only detection silently kept the PREVIOUS user's UI build
 // after every reinstall, so the old 45-second download worker kept running.
 // For this pinned candidate compare the actual verified UI bundle fingerprint.
 const pinnedCandidate=require('./lab104-candidate.cjs').pinnedOnly===true&&require('./update-trust.cjs').newer(version,'1.0.103');
 /* R1959 native only: restore an already downloaded and hash-verified UI at startup. */
 if(pinnedCandidate){
  const current=store.get('uiRoot'),installedBuild=store.get('uiBuild');
  if(current&&current!==bundled&&/^[a-f0-9]{64}$/.test(String(installedBuild||''))){
   try{
    const record=JSON.parse(fs.readFileSync(path.join(current,'.pb-lab-bundle-manifest.json'),'utf8'));
    require('./prepare-assets.cjs').validate(record);
    if(record.build===installedBuild){
     for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1363-lab-queue.js']){
      const row=record.files.find(e=>e.name===name);
      if(!row)throw Error('native_verified_ui_file_missing');
      if(crypto.createHash('sha256').update(fs.readFileSync(path.join(current,name))).digest('hex')!==row.sha256)throw Error('native_verified_ui_hash_mismatch');
     }
     validate(current);return false;
    }
   }catch{/* Invalid snapshot: retain bundled fallback. */}
  }
 }
 if(!pinnedCandidate&&store.get('uiEmbeddedForNativeVersion')===version)return false;
 const manifest=readEmbeddedManifest(bundled);
 if(pinnedCandidate&&store.get('uiEmbeddedForNativeBuild')===manifest.build&&store.get('uiRoot')===bundled)return false;
 verifyEmbeddedUi(bundled,validate,manifest);
 store.transaction(()=>{const previous=store.get('uiRoot');if(previous&&previous!==bundled){store.set('uiPreviousRoot',previous);store.set('uiPreviousBuild',store.get('uiBuild')||null);}store.set('uiRoot',bundled);store.set('uiBuild',manifest.build);store.set('uiEmbeddedForNativeVersion',version);store.set('uiEmbeddedForNativeBuild',manifest.build);store.set('updateError',null);});
 return true;
}
function readEmbeddedManifest(bundled){
 const manifest=JSON.parse(fs.readFileSync(path.join(bundled,'.pb-lab-bundle-manifest.json'),'utf8'));
 require('./prepare-assets.cjs').validate(manifest);
 return manifest;
}
function verifyEmbeddedUi(bundled,validate=require('./verify-native-ui.cjs').validateNativeUi,manifest=readEmbeddedManifest(bundled)){
 validate(bundled);
 for(const entry of manifest.files){const bytes=fs.readFileSync(path.join(bundled,entry.name));if(crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('embedded_ui_integrity_failed:'+entry.name);}
 return manifest;
}
module.exports={adoptEmbeddedUi,verifyEmbeddedUi};
