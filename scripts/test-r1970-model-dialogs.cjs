'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
for(const root of ['dist/web','dist/web/lab-desktop-ui'])test('R1970: '+root+' serves focused model dialogs and its stylesheet',()=>{
 const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
 assert.equal(ui.split('return e.jsx(PB1970ModelDialogShell,{').length-1,2);
 assert(ui.includes('dialog.showModal()'));assert(ui.includes('if(!busy)closeRef.current'));
 assert(fs.readFileSync(root+'/index.html','utf8').includes('photobridge-r1970-model-dialog.css'));
});
test('R1970: updater manifest pins the new model dialog stylesheet and module',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['photobridge-r1970-model-dialog.css','assets/index-UIRefine-v655-r84.js']){
  const entry=manifest.files.find(f=>f.name===name);assert(entry,name);
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});
