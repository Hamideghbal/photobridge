const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('both committed native lab-switch paths synchronize chooser selection after context confirmation',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');assert.equal(ui.split('window.dispatchEvent(new CustomEvent("photobridge-lab-selected"').length-1,2);
 const chooser=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');assert(chooser.includes("window.addEventListener('photobridge-lab-selected'"));assert(chooser.includes("lastPath='';refreshQueued=false;cleanup();"));
});
test('embedded SPA navigation retains frame identity, never changes external/top-level destinations',()=>{
 const src=fs.readFileSync('scripts/r1467-embedded-route.js','utf8'),calls=[];const history={pushState:(...a)=>calls.push(a),replaceState:(...a)=>calls.push(a)},w={frameElement:{closest:()=>true}},parent={};
 const c={window:w,parent,history,location:{href:'https://panel.test/photographer/orders/flow?workspace=print&pbDesktopContent=1',origin:'https://panel.test'},URL};vm.runInNewContext(src,c);history.pushState({n:1},'','/photographer/orders/needs_fix?x=2');let u=new URL(calls[0][2],'https://panel.test');assert.equal(u.searchParams.get('pbDesktopContent'),'1');assert.equal(u.searchParams.get('workspace'),'print');assert.equal(u.searchParams.get('x'),'2');assert.equal(calls[0][0].n,1);
 history.replaceState(null,'','https://other.test/photographer/upload');assert.equal(calls.at(-1)[2],'https://other.test/photographer/upload');history.pushState(null,'','/photographer/orders/flow?pbLabChooser=1');assert(new URL(calls.at(-1)[2],'https://panel.test').searchParams.has('pbLabChooser'));
 c.parent=w;history.pushState(null,'','/photographer/upload');assert.equal(calls.at(-1)[2],'/photographer/upload');
});
test('manual order mutations use native live-only requests and reject queued responses',async()=>{
 const src=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8'),a=src.indexOf('async function api('),b=src.indexOf('\nfunction field(',a);assert(a>0&&b>a);const calls=[];let queued=false;const c={storage:()=>({request:async(url,options)=>{calls.push({url,options});return queued?{queued:true,operationId:'queued-id'}:{orderId:'id'};}}),errors:{},Error};vm.runInNewContext(src.slice(a,b),c);
 const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';for(const p of ['/api/lab/delegated-orders','/api/lab/delegated-orders/'+id+'/files/presign','/api/lab/delegated-orders/'+id+'/submit']){await c.api(p,{localOnly:true});assert.equal(calls.at(-1).url,p+'/download');assert.equal(calls.at(-1).options.method,'POST');}
 await c.api('/api/lab/orders/'+id);assert.equal(calls.at(-1).url,'/api/lab/orders/'+id+'/download');await c.api('/api/lab/delegated-orders/bootstrap?mode=print');assert.equal(calls.at(-1).url,'/api/lab/delegated-orders/bootstrap?mode=print');queued=true;await assert.rejects(c.api('/api/lab/delegated-orders',{}),/ارتباط زنده/);
});
test('native live aliases retain canonical order/file UUID captures and existing security boundary',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8'),id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';for(const [name,path]of [['delegatedFiles','files/presign'],['submitDelegatedOrder','submit']]){const re=server.match(new RegExp('const '+name+' = url\\.pathname\\.match\\(([^;]+)\\);'));assert(re);const regex=vm.runInNewContext(re[1]);for(const suffix of ['', '/download'])assert.equal(regex.exec('/api/lab/delegated-orders/'+id+'/'+path+suffix)[1],id);assert.equal(regex.exec('/api/lab/delegated-orders/not-an-id/'+path+'/download'),null);}
 assert(server.includes("['/api/lab/delegated-orders','/api/lab/delegated-orders/download'].includes(url.pathname)"));assert(server.includes("if (!requireRole(a, 'lab_admin') || !a?.labId)"));assert(server.includes('if (b.localOnly === true && !await requireLocalIntakePrimary()) return;'));
});
test('photo selection opens a native image-file picker before requesting permission to delete selected originals',()=>{
 const src=fs.readFileSync('scripts/r1466-intake-move.js','utf8');assert(src.indexOf('showOpenFilePicker({multiple:true')<src.indexOf('showDirectoryPicker({id:'));assert(src.includes("description:'عکس‌های سفارش'"));assert(src.includes("input.type='file'"));assert(src.includes("فقط کپی؛ مبدأ باقی بماند"));assert(src.includes("if(handleByFile.has(file)&&!await handle.isSameEntry(handleByFile.get(file)))"));
});
