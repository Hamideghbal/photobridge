'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function adoptEmbeddedUi({store,bundled,version,validate=require('./verify-native-ui.cjs').validateNativeUi}){
 if(store.get('uiEmbeddedForNativeVersion')===version)return false;
 validate(bundled);
 const manifest=JSON.parse(fs.readFileSync(path.join(bundled,'.pb-lab-bundle-manifest.json'),'utf8'));
 require('./prepare-assets.cjs').validate(manifest);
 for(const entry of manifest.files){const bytes=fs.readFileSync(path.join(bundled,entry.name));if(crypto.createHash('sha256').update(bytes).digest('hex')!==entry.sha256)throw Error('embedded_ui_integrity_failed:'+entry.name);}
 store.transaction(()=>{const previous=store.get('uiRoot');if(previous&&previous!==bundled){store.set('uiPreviousRoot',previous);store.set('uiPreviousBuild',store.get('uiBuild')||null);}store.set('uiRoot',bundled);store.set('uiBuild',manifest.build);store.set('uiEmbeddedForNativeVersion',version);store.set('updateError',null);});
 return true;
}
module.exports={adoptEmbeddedUi};
