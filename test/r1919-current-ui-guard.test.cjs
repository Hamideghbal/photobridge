'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {validateCurrentIntake}=require('../r1919-current-ui-guard.cjs');
const {buildBundledUi}=require('../prepare-assets.cjs');
function temp(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1919-'));try{return fn(root)}finally{fs.rmSync(root,{recursive:true,force:true})}}
function write(root,js){fs.writeFileSync(path.join(root,'index.html'),'<script src="/photobridge-r1137-lab-local-intake.js"></script>');fs.writeFileSync(path.join(root,'photobridge-r1137-lab-local-intake.js'),js);}
test('R1919: old separate Copy Photos / Move Photos buttons cannot reenter Windows candidate',()=>temp(root=>{
 write(root,"const movePhotos=node('button','انتقال عکس');fileActions.append(choose,movePhotos);");
 assert.throws(()=>validateCurrentIntake(root),/obsolete_two_button_photo_picker/);
}));
test('R1919: current photo-local copy/cut tag is retained without rewriting the site JS',()=>temp(root=>{
 const js="window.photoTag={mode:'copy',toggle:()=>{window.photoTag.mode=window.photoTag.mode==='copy'?'cut':'copy'}};";
 write(root,js);
 assert.equal(validateCurrentIntake(root).modernCandidate,true);
 assert.equal(fs.readFileSync(path.join(root,'photobridge-r1137-lab-local-intake.js'),'utf8'),js);
}));
test('R1919: absent, unreferenced and malformed UI assets fail closed',()=>temp(root=>{
 assert.throws(()=>validateCurrentIntake(root));
 write(root,'function {');
 assert.throws(()=>validateCurrentIntake(root),SyntaxError);
 fs.writeFileSync(path.join(root,'index.html'),'<html></html>');
 assert.throws(()=>validateCurrentIntake(root),/missing_from_index/);
}));
test('R1919: strict builds fail before writing anything when site-refresh is not selected',async()=>{
 const prev=process.env.PB_LAB_REQUIRE_CURRENT_INTAKE;process.env.PB_LAB_REQUIRE_CURRENT_INTAKE='1';
 try{await assert.rejects(buildBundledUi({refresh:false,offline:true}),/requires_fresh_verified_site_manifest/);}
 finally{if(prev===undefined)delete process.env.PB_LAB_REQUIRE_CURRENT_INTAKE;else process.env.PB_LAB_REQUIRE_CURRENT_INTAKE=prev;}
});
