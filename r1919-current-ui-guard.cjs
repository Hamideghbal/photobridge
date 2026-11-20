'use strict';
const fs=require('node:fs'),path=require('node:path');
// This release gate intentionally does NOT invent or replace any website UI.
// The real, hash-verified current site must be downloaded separately.
function validateCurrentIntake(root){
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const file='photobridge-r1137-lab-local-intake.js';
 if(!index.includes(file))throw Error('r1919_current_intake_script_missing_from_index');
 const source=fs.readFileSync(path.join(root,file),'utf8');
 if(!source.trim())throw Error('r1919_current_intake_script_empty');
 // The obsolete UI shows separate Copy Photos and Move Photos buttons.
 // Reject that exact implementation rather than rolling the user's UI back.
 if(/movePhotos\s*=\s*node\(['"]button['"],['"]انتقال عکس['"]/.test(source)||
    /fileActions\.append\(choose,\s*movePhotos\)/.test(source))
  throw Error('r1919_obsolete_two_button_photo_picker: fetch and verify current site UI; do not replace it with the October pinned script');
 // Ensure the copied original can at least be parsed before packaging.
 new Function(source);
 return{file,modernCandidate:true};
}
module.exports={validateCurrentIntake};
