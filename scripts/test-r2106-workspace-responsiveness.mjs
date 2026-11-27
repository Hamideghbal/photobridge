import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {patchPicker,patchBooking} from './enable-r2106-workspace-responsiveness.mjs';

test('selected role does not re-open account chooser on focus; unselected roles retain existing behavior',()=>{
  const source=patchPicker('function foreground(){reopen();}');
  for(const role of ['photographer','lab','rental',null])for(const authorized of [true,false]){
    const fn=new Function('role','authorized',`let checking=false,chooser=null,wasHidden=true,blurred=true,needsResume=true,reopened=0;const currentPortal=()=>role;function reopen(){reopened++};${source};foreground();return {reopened,wasHidden,blurred,needsResume}`);
    assert.deepEqual(fn(role,authorized),role&&authorized?{reopened:0,wasHidden:false,blurred:false,needsResume:false}:{reopened:1,wasHidden:true,blurred:true,needsResume:true});
  }
});
test('booking response still requires original confirmation and optional polling is deferred',()=>{
  const source=patchBooking("if(submit)submit.disabled=true;let out; if(submit)submit.disabled=!$('#rentalRequestConsentV809')?.checked;function refreshVisibleStoreData(force=false){if(document.hidden)return;}");
  assert.match(source,/aria-busy/);
  assert.match(source,/در حال ثبت آفیش/);
  assert.match(source,/if\(pb2100Submitting\)return/);
  assert.equal(patchBooking(source),source);
});
test('all final documents contain the lifecycle change and booking retains commit confirmation',()=>{
  for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
    const html=fs.readFileSync(path,'utf8');
    assert.match(html,/PB2106 preserve selected workspace/);
    assert.match(html,/async function check\(cold\)/);
    assert.match(html,/const validSession=async portal/);
  }
  const book=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
  assert.match(book,/PB2106 visible booking feedback/);
  assert.match(book,/if\(!out\?\.ok\|\|!out\.id\)/);
});
