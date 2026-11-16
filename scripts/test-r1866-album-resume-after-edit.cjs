'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const id='11111111-1111-4111-8111-111111111111';
const a='22222222-2222-4222-8222-222222222222';
const b='33333333-3333-4333-8333-333333333333';
function component(root){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const start=js.indexOf('function Kv('),end=js.indexOf('function ',start+12);
  assert(start>=0&&end>start,'album component present');
  assert.doesNotThrow(()=>new vm.Script(js),root+' valid JavaScript');
  return js.slice(start,end);
}
function recovery(kv,files,trace=[]){
  const start=kv.indexOf('Bt=async($e,gt)=>{');
  const end=kv.indexOf(',pb1865Cancel=()=>',start);
  assert(start>=0&&end>start,'resume function present');
  let current=[];
  const me=async(url,options)=>{
    trace.push({url,options});
    if(url==='/api/customer/orders/'+id)return {order:{id,status:'uploading',mode:'album'},files};
    return {ok:true};
  };
  const fn=new Function('Me','tt','ce','pt',
    'return ('+kv.slice(start+3,end)+')');
  const ce={current:[]};
  const callable=fn(me,f=>f.paperOverride||'luster',ce,arr=>{current=arr});
  return {call:rows=>callable(id,rows),trace,ce,getCurrent:()=>current};
}
const file=(idName='sheet-1.psd',size=150)=>({name:idName,size});
const row=(fileId,name='sheet-1.psd',size=150,extra={})=>({
  id:fileId,original_name:name,relative_path:name,bytes:size,
  print_type:'luster',original_state:'active',...extra
});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  test('R1866: source and controls in '+root,()=>{
    const s=component(root),html=fs.readFileSync(root+'/index.html','utf8');
    assert(s.includes('pb1866Reset.current=Tu(Xe)'));
    assert.equal(s.split('he.current=null,st.current="",A(0),Re("idle")').length-1,2);
    assert(s.includes('await pb1866Reset.current'));
    assert(s.includes('nt=()=>{if(je||!ot.size)return;'));
    assert(s.includes('className:"albumFileRemove","aria-label":"حذف",disabled:je'));
    assert(s.includes('Y==="error"?"ادامه ارسال"'));
    assert(!s.includes('children:"↻ ادامه ارسال"'));
    assert(s.includes('pb1866ResumeHint'));
    assert(s.includes('needsReupload:true'));
    assert(s.includes('legacyCompleted:Boolean('));
    assert(s.includes('Bt(String(jn.id),pn).catch('));
    assert(html.includes('albumResume=r1866'));
    assert(html.includes('pb-album-resume-fix'));
  });
  test('R1866: server verified file ID wins over converted filename/size in '+root,async()=>{
    const testbed=recovery(component(root),[row(a,'converted.jpg',991)]);
    const result=await testbed.call([{id:'local-1',file:file('original.psd',201),
      path:'original.psd',paperOverride:'luster',serverFileId:a,progress:0}]);
    assert.equal(result[0].progress,100);
    assert.equal(result[0].serverFileId,a);
    assert(!testbed.trace.some(x=>x.url.includes('/uploads/')));
  });
  test('R1866: new identical filename is NOT mistakenly skipped in '+root,async()=>{
    const testbed=recovery(component(root),[row(a)]);
    const result=await testbed.call([{id:'new-local-file',file:file(),path:'sheet-1.psd',progress:0}]);
    assert.equal(result[0].progress,0);
    assert.equal(result[0].serverFileId,null);
    assert.equal(testbed.trace.length,1,'only fetch, no upload side effects');
  });
  test('R1866: legacy completed local draft can match exact old file in '+root,async()=>{
    const testbed=recovery(component(root),[row(a)]);
    const result=await testbed.call([{id:'old-local',file:file(),path:'sheet-1.psd',
      legacyCompleted:true,progress:0}]);
    assert.equal(result[0].progress,100);
    assert.equal(result[0].serverFileId,a);
    assert.equal(result[0].legacyCompleted,false);
  });
  test('R1866: stale/deleted/upload pending are not treated as sent in '+root,async()=>{
    const testbed=recovery(component(root),[row(a,'sheet-1.psd',150,{original_state:'deleted'})]);
    const result=await testbed.call([{id:'old-local',file:file(),path:'sheet-1.psd',
      serverFileId:a,progress:100}]);
    assert.equal(result[0].progress,0);
    assert.equal(result[0].serverFileId,null);
  });
  test('R1866: edited paper forces reupload without invalidating other verified pages in '+root,async()=>{
    const testbed=recovery(component(root),[row(a),row(b,'sheet-2.psd',180)]);
    const result=await testbed.call([
      {id:'changed',file:file(),path:'sheet-1.psd',paperOverride:'silk',
        needsReupload:true,serverFileId:null,progress:0},
      {id:'untouched',file:file('sheet-2.psd',180),path:'sheet-2.psd',
        paperOverride:'luster',serverFileId:b,progress:0}
    ]);
    assert.equal(result[0].progress,0);
    assert.equal(result[1].progress,100);
    assert.equal(result[1].serverFileId,b);
  });
}
test('R1866: owner/order check rejects an unrelated draft',async()=>{
  const s=component('dist/web');
  const start=s.indexOf('Bt=async($e,gt)=>{');
  const end=s.indexOf(',pb1865Cancel=()=>',start);
  const get=async()=>({order:{id:'not-our-order',status:'uploading',mode:'album'},files:[]});
  const bt=new Function('Me','tt','ce','pt','return ('+s.slice(start+3,end)+')')
    (get,()=> 'luster',{current:[]},()=>{});
  await assert.rejects(()=>bt(id,[]),/album_draft_not_found/);
});
test('R1866: Windows update manifest hashes match delivered files',()=>{
  const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
  const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
  for(const filename of ['index.html','assets/index-UIRefine-v655-r84.js']){
    const found=m.files.find(x=>x.name===filename);
    assert(found,'missing '+filename);
    assert.equal(found.sha256,hash(fs.readFileSync(root+'/'+filename)),filename);
  }
  assert.equal(m.build,hash(JSON.stringify(m.files)));
});
