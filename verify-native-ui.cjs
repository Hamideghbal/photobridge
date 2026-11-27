'use strict';
const fs=require('node:fs'),path=require('node:path');
const {patchStorageBundle}=require('./storage-bundle.cjs');
function validatePagedLabQueue(source){
  // Older UI bundles can satisfy the native-storage bridge yet silently
  // switch the Windows queue back to fetching the complete order history.
  const markers=['PB1944 server-paged lab queue','paged=1&mode=',
    'seq!==pbLiveOrders.current.seq','__pb1945Legacy',
    'stage.slice((r1944Page-1)*10,r1944Page*10)'];
  const missing=markers.filter(value=>!source.includes(value));
  if(missing.length)throw Error('native_paged_lab_ui_stale: '+missing.join(', '));
}
function validateNativeUi(root){require('./navigation-contract.cjs').validateNavigation(root);const file=path.join(root,'assets/index-UIRefine-v655-r84.js');if(!fs.existsSync(file))throw Error('native_storage_ui_bundle_missing');const source=fs.readFileSync(file,'utf8');validatePagedLabQueue(source);patchStorageBundle(source);require('./native-intake-168.cjs').compileRoot(root);}
if(require.main===module){try{validateNativeUi(process.argv[2]||path.join(__dirname,'runtime'));console.log('Native storage bridge: verified against bundled website')}catch(e){console.error('STOP: native storage bridge cannot attach to this UI:',e.message);process.exitCode=1}}
module.exports={validateNativeUi,validatePagedLabQueue};
