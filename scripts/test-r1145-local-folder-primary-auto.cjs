const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const start=source.indexOf('function Xj(){');
assert(start>0,'lab local-folder settings view must exist');
const selectStart=source.indexOf('const T=async()=>',start);
const selectEnd=source.indexOf(',k=async()=>',selectStart);
assert(selectStart>start&&selectEnd>selectStart,'folder picker click handler found');
const selection=source.slice(selectStart,selectEnd);
const mountSelect=(deps)=>Function('no','vc','a','r','p','h','Hu','alert',selection+';return T;')(
 deps.no,deps.vc,deps.setRoot,deps.setPermission,deps.setDevice,deps.setBusy,deps.fetchDevice,deps.alert);
const pickStart=source.indexOf('async function no(){');
const pickEnd=source.indexOf('async function Vs(t)',pickStart);
assert(pickStart>0&&pickEnd>pickStart,'folder persistence operation found');
const folderPicker=(deps)=>Function('ai','window','Vs','Oy','qs','console',source.slice(pickStart,pickEnd)+';return no;')(
 deps.supported, deps.window, deps.permission, deps.persist, deps.load, {error:()=>{}});

test('choosing folder automatically makes its workstation primary with explicit transfer',async()=>{
 const calls=[];const root={name:'D-drive',queryPermission:async()=> 'granted'};
 const state={};
 const pick=mountSelect({no:async()=>root,vc:async(force)=>{calls.push(force);return {registered:true,isThisDevice:true}},setRoot:x=>state.root=x,setPermission:x=>state.permission=x,setDevice:x=>state.device=x,setBusy:x=>state.busy=x,fetchDevice:async()=>null,alert:x=>calls.push('alert:'+x)});
 await pick();
 assert.equal(calls.length,1);assert.equal(calls[0],true);
 assert.equal(state.root,root);assert.equal(state.permission,'granted');
 assert.equal(state.device.isThisDevice,true);assert.equal(state.busy,false);
});
test('saved hard-drive folder survives device registration error',async()=>{
 const root={name:'photos',queryPermission:async()=> 'granted'};
 const warnings=[];const state={};
 const pick=mountSelect({no:async()=>root,vc:async()=>{throw Object.assign(new Error('primary_device_exists'),{data:{error:'primary_device_exists'}})},setRoot:v=>state.root=v,setPermission:v=>state.permission=v,setDevice:v=>state.device=v,setBusy:()=>{},fetchDevice:async()=>({registered:true,isThisDevice:false}),alert:v=>warnings.push(v)});
 await pick();
 assert.equal(state.root,root,'local folder remains selected after server failure');
 assert.equal(state.device.isThisDevice,false);
 assert.equal(warnings.length,1);
 assert.match(warnings[0],/مسیر روی هارد ذخیره شد/);
 assert.match(warnings[0],/ثبت خودکار/);
});
test('canceling picker does not bind or replace selected folder',async()=>{
 let calls=0;const root={};
 const pick=mountSelect({no:async()=>{throw Object.assign(new Error('user canceled'),{name:'AbortError'})},vc:async()=>{calls++},setRoot:()=>{calls++},setPermission:()=>{},setDevice:()=>{},setBusy:()=>{},fetchDevice:async()=>null,alert:()=>{calls++}});
 await pick();assert.equal(calls,0);
});
test('permission is checked before overwriting persisted folder',async()=>{
 const log=[],candidate={name:'selected'};
 const pick=folderPicker({supported:()=>true,window:{showDirectoryPicker:async()=>({...candidate,queryPermission:async()=> 'prompt'})},permission:async()=>false,persist:async()=>log.push('persist'),load:async()=>candidate});
 await assert.rejects(pick(),/folder_permission_denied/);assert.deepEqual(log,[]);
});
test('only a confirmed stored handle counts as successful folder choice',async()=>{
 const candidate={name:'photos',queryPermission:async()=> 'granted'};
 const pick=folderPicker({supported:()=>true,window:{showDirectoryPicker:async()=>candidate},permission:async()=>true,persist:async()=>{},load:async()=>({...candidate,isSameEntry:async()=>false})});
 await assert.rejects(pick(),/مرورگر نتوانست دسترسی پوشه را ذخیره کند/);
});
test('picker help does not demand a second manual primary-device action',()=>{
 const settings=source.slice(start,source.indexOf('function ',start+12)>start?source.indexOf('function ',start+12):start+10000);
 assert.doesNotMatch(settings,/onClick:E,children:/);
 assert.match(settings,/با انتخاب پوشه روی هارد، همین کامپیوتر خودکار/);
});
