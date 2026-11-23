'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {patchModelDialogs}=require('../model-dialog-patch.cjs');
const source='function PB1791ModelNameDialog(){return e.jsx(On,{title:"name",onClose,children:child})}\nfunction PB1777FrameModelEditor(){return e.jsx(On,{title:"colors",onClose,children:child})}\nfunction end(){}';
test('native model patch promotes both editors to keyboard-owning dialogs once',()=>{
 const fixed=patchModelDialogs(source);assert.equal(fixed.split('return e.jsx(PB1970ModelDialogShell,{').length-1,2);
 assert(fixed.includes('dialog.showModal()'));assert(fixed.includes('input?.focus()'));assert(fixed.includes('if(!busy)closeRef.current'));
 assert.equal(patchModelDialogs(fixed),fixed);assert.equal(source.includes('PB1970'),false);
});
test('legacy bundled UI without the new model editor stays compatible',()=>{
 const old=fs.readFileSync('verified-ui/assets/index-UIRefine-v655-r84.js','utf8');
 assert.doesNotThrow(()=>patchModelDialogs(old));
});
