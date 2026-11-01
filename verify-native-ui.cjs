'use strict';
const fs=require('node:fs'),path=require('node:path');
const {patchStorageBundle}=require('./storage-bundle.cjs');
function validateNativeUi(root){require('./navigation-contract.cjs').validateNavigation(root);const file=path.join(root,'assets/index-UIRefine-v655-r84.js');if(!fs.existsSync(file))throw Error('native_storage_ui_bundle_missing');patchStorageBundle(fs.readFileSync(file,'utf8'));}
if(require.main===module){try{validateNativeUi(process.argv[2]||path.join(__dirname,'runtime'));console.log('Native storage bridge: verified against bundled website')}catch(e){console.error('STOP: native storage bridge cannot attach to this UI:',e.message);process.exitCode=1}}
module.exports={validateNativeUi};
