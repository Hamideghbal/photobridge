'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createUnifiedUpdates}=require('../unified-updates.cjs');
function fixture({ready=false,busy=false,safe=true,program='current',fail=false}={}){
 const events=[];let available=ready,active=busy;
 const u=createUnifiedUpdates({
  checkProgram:async()=>{events.push('program');return{state:program}},
  checkUi:async report=>{events.push('download');report(1,1);if(fail)throw Error('offline');available=true},
  uiBusy:()=>active,waitForUi:async()=>{events.push('wait');active=false},
  pending:()=>available,uiError:()=>false,canApply:async()=>safe,
  apply:async()=>{events.push('apply');available=false;return true},
  show:async()=>events.push('show'),prompt:async state=>{events.push('prompt:'+state.kind);return 'apply'},
  isOnline:()=>true,progress:()=>events.push('progress'),stopProgress:()=>events.push('stop')
 });
 return{u,events};
}
test('cached UI applies without downloading again or checking native installer',async()=>{const f=fixture({ready:true});await f.u.check();assert.deepEqual(f.events,['show','prompt:ready','apply'])});
test('tray fast action applies cached UI in a single click',async()=>{const f=fixture({ready:true});await f.u.checkUiOnly();assert.deepEqual(f.events,['show','apply'])});
test('native installer busy state cannot suppress new UI',async()=>{const f=fixture({program:'busy'});await f.u.check();assert(f.events.includes('apply'));assert(!f.events.includes('program'))});
test('tray fast action downloads then applies exactly once',async()=>{const f=fixture();await f.u.checkUiOnly();assert.equal(f.events.filter(x=>x==='download').length,1);assert(f.events.includes('apply'));assert(!f.events.includes('prompt:ready'))});
test('an open form prevents UI replacement',async()=>{const f=fixture({ready:true,safe:false});await f.u.checkUiOnly();assert(!f.events.includes('apply'));assert(f.events.includes('prompt:busy'))});
test('wait for active UI download before applying',async()=>{const f=fixture({ready:true,busy:true});await f.u.checkUiOnly();assert.deepEqual(f.events,['show','wait','apply'])});
test('a failed download preserves current UI and reports an error',async()=>{const f=fixture({fail:true});await f.u.check();assert(!f.events.includes('apply'));assert(f.events.includes('prompt:error'))});
test('regular check still observes installer state if no UI pending',async()=>{const events=[];const u=createUnifiedUpdates({show:async()=>{},uiBusy:()=>false,pending:()=>false,isOnline:()=>true,checkUi:async()=>{},uiError:()=>false,checkProgram:async()=>{events.push('program');return{state:'busy'}},prompt:async()=>{events.push('prompt')}});await u.check();assert.deepEqual(events,['program'])});
