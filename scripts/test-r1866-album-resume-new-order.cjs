'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=path=>fs.readFileSync(path,'utf8');
const roots=['dist/web','dist/web/lab-desktop-ui'];
function album(root){
 const code=read(root+'/assets/index-UIRefine-v655-r84.js');
 assert.doesNotThrow(()=>new vm.Script(code),'full bundle must compile');
 const start=code.indexOf('function Kv('),end=code.indexOf('function ',start+12);
 assert(start>=0&&end>start);
 return {kv:code.slice(start,end),code};
}
test('R1866: never trust cached 100% before read-only server verification',()=>{
 for(const root of roots){
  const {kv}=album(root);
  assert(kv.includes('ce.current=pn.map(row=>({...row,progress:0})),pt(ce.current),Ze('));
  assert(kv.includes('Bt=async($e,gt,pb1866InspectOnly=!1)'));
  assert(kv.includes('for(const Yt of Kt)pb1866InspectOnly||await Me('));
  assert(kv.includes('Bt(String(jn.id),pn,!0).catch('));
  assert(kv.includes('String(Ln.original_state||"")==="active"?{...Yt,progress:100,serverFileId:String(Ln.id)}'));
  assert(kv.includes('paperOverride:Nt||"luster",progress:0,pb1866New:!0'));
  assert(kv.includes('Yt.pb1866New&&!Yt.serverFileId'));
  assert(kv.includes('Yt.serverFileId&&In!==String(Yt.serverFileId)'));
  assert(kv.includes('serverFileId:String(An.fileId),progress:1'));
  assert(kv.includes('Number($e.progress||0)>=100&&$e.serverFileId?"success"'));
  assert(kv.includes('Number($e.progress||0)>=100&&$e.serverFileId?"✓ ارسال شد و تأیید شد"'));
 }
});
test('R1866: both single and bulk clear start a fresh order',()=>{
 for(const root of roots){
  const {kv}=album(root);
  const reset='he.current=null,Re("idle"),pe(""),A(0),Pt.current=!1,Tu(Xe)';
  assert.equal(kv.split(reset).length-1,2);
  assert(kv.includes('gt.length?P(!1,gt).catch(()=>{}):('+reset+')'));
  assert(kv.includes('$e.length?P(!1,$e).catch(()=>{}):('+reset+')'));
  assert(kv.includes('sn=he.current;sn||(sn=(await Me('));
  assert(kv.includes('album/reconcile'));
 }
});
test('R1866: interrupted transfers only retain confirmed pages',()=>{
 for(const root of roots){
  const {kv,code}=album(root);
  assert(kv.includes('pb1865Cancel=()=>{if(!je)return;dt.current+=1'));
  assert(kv.includes('fn.serverFileId?{...fn,progress:100}:{...fn,progress:0,serverFileId:null}'));
  assert(kv.includes('void P(!1,ce.current).catch(()=>{})'));
  assert(kv.includes('await PB1866CacheConvertedFile(Xe,Yn)'));
  assert(kv.includes('Ba.id===Yn.id?{...Ba,progress:Math.min(99,fn)}:Ba'));
  assert(code.includes('async function PB1866CacheConvertedFile(key,row)'));
  assert(code.includes('tx.objectStore(Ws).put(row.file,key+":"+row.id)'));
  assert(!kv.includes('await P(!0,ce.current)),ce.current=ce.current.map'));
 }
});
test('R1866: only bottom price summary provides retry',()=>{
 for(const root of roots){
  const {kv}=album(root);
  assert(kv.includes('className:"albumUploadResumeNotice"'));
  assert(!kv.includes('children:"↻ ادامه ارسال"'));
  assert(kv.includes('children:je?"در حال ارسال…":Y==="error"&&he.current?"ادامه ارسال"'));
  assert(kv.includes('className:"pb1865AlbumCancel",onClick:pb1865Cancel'));
  const html=read(root+'/index.html');
  assert(html.includes('pb-album-resume'));
  assert(html.includes('albumResume=r1866'));
 }
});
test('R1866: Windows manifest reflects actual patched assets',()=>{
 const m=JSON.parse(read('dist/web/lab-desktop-ui/manifest.json'));
 const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
  const row=m.files.find(f=>f.name===name);
  assert(row,'missing '+name);
  assert.equal(row.sha256,hash(fs.readFileSync('dist/web/lab-desktop-ui/'+name)));
 }
 assert.equal(m.build,hash(JSON.stringify(m.files)));
});
