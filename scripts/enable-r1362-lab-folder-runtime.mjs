/** R1362: single-flight folder selection; no changes to selected directory or files. */
import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let src=fs.readFileSync(file,'utf8');
const mark='/* PB1362 single-flight Lab folder picker */';
if(!src.includes(mark)){
 const start=src.indexOf('async function no(){if(!ai())throw new Error("folder_picker_unsupported")');
 const end=start<0?-1:src.indexOf('async function Vs(t)',start);
 if(start<0||end<0||src.indexOf('async function no(){',start+1)>=0)throw Error('R1362 unexpected folder picker source');
 const old=src.slice(start,end);
 if(!old.includes('await window.showDirectoryPicker({mode:"readwrite"})')||!old.includes('await Oy(handle)')||!old.includes('return handle}'))throw Error('R1362 folder permission/persistence source changed');
 const body=old.slice('async function no(){'.length,-1);
 const wrapper=mark+'let pb1362FolderPickerPending=null;async function no(){if(pb1362FolderPickerPending)return pb1362FolderPickerPending;const selected=(async()=>{'+body+'})();pb1362FolderPickerPending=selected;try{return await selected}finally{if(pb1362FolderPickerPending===selected)pb1362FolderPickerPending=null}}\n';
 src=src.slice(0,start)+wrapper+src.slice(end);fs.writeFileSync(file,src);
 console.log('[R1362] One user-initiated folder picker per window; persisted handles preserved');
}
