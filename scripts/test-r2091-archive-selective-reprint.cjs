const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const edit=(id,changes={})=>({id,printSizeId:'10x15',printType:'luster',printCopies:1,cropHandling:'none',chassis:false,frame:false,...changes});
const originals=[{id:'one',print_size_id:'10x15',print_type:'luster',print_copies:1,chassis:false,frame:false,addon_selection:{},object_key:'source-one'},{id:'two',print_size_id:'10x15',print_type:'silk',print_copies:1,chassis:false,frame:false,addon_selection:{},object_key:'source-two',original_state:'deleted'}];
const options={canUseSize:async id=>id==='20x30',snapshotAddons:async item=>item.frame?{frame:{id:item.frameModelId,name:'resolved on server',unitPrice:100}}:{}};
test('R2091: only selected files are copied, new print settings and addon snapshot apply, original unchanged',async()=>{
 const {selectArchivePrintFiles}=await import('../dist/api/archive-print-selection.js');
 const result=await selectArchivePrintFiles(originals,[edit('one',{printSizeId:'20x30',printType:'metallic',printCopies:3,frame:true,frameModelId:'model',cropHandling:'lab'})],options);
 assert.equal(result.length,1);assert.equal(result[0].object_key,'source-one');assert.equal(result[0].print_size_id,'20x30');assert.equal(result[0].print_type,'metallic');assert.equal(result[0].print_copies,3);assert.equal(result[0].crop_handling,'lab');assert.equal(result[0].addon_selection.frame.unitPrice,100);assert.equal(originals[0].print_size_id,'10x15');assert.equal(originals[0].frame,false);
});
test('R2091: unknown, duplicate, empty selection, invalid settings and partial album rejected before copy',async()=>{
 const {selectArchivePrintFiles}=await import('../dist/api/archive-print-selection.js');
 for(const selection of [[],[edit('foreign')],[edit('one'),edit('one')],[edit('one',{printSizeId:'foreign-size'})],[edit('one',{printCopies:0})],[edit('one',{printType:'none'})],[edit('one',{cropHandling:'invalid'})]])await assert.rejects(selectArchivePrintFiles(originals,selection,options),e=>e.status===400);
 await assert.rejects(selectArchivePrintFiles(originals,[edit('one')],{...options,mode:'album'}),e=>e.status===400);
 assert.equal(await selectArchivePrintFiles(originals,undefined,options),originals);
});
test('R2091: original local path lookup remains before edited registration; cloud scope and count restricted',()=>{
 const s=fs.readFileSync('dist/api/server.js','utf8');const a=s.indexOf('const labArchiveRecover ='),b=s.indexOf('const recoveredLocalRegister =',a),p=s.slice(a,b);
 assert.match(p,/selectArchivePrintFiles\(fq.rows,b.selection/);assert.match(p,/const deleted = selectedRows.filter/);assert.match(p,/for \(const f of selectedRows\)/);assert.match(p,/expectedFileCount: selectedRows.length/);assert.match(p,/JSON.stringify\(f.addon_selection\|\|\{\}\)/);
 const reg=s.slice(b,s.indexOf('const recoveredFilePresign =',b));assert.match(reg,/f.id=\$1 AND f.order_id=\$2 AND f.lab_id=\$3/);assert.match(reg,/JSON.stringify\(selectedSource\?\.addon_selection/);
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const ui=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const start=ui.indexOf('ie=async K=>{',ui.indexOf('function hb(')),end=ui.indexOf(';return e.jsxs("section",{className:"archiveWorkspace',start),handler=ui.slice(start,end);
  assert.match(handler,/pb2091ChooseArchivePhotos/);assert.match(handler,/m.files.filter/);assert.match(handler,/pb2091ArchiveResult/);assert(!/location\.(href|replace|reload)/.test(handler));
  const local=ui.slice(ui.indexOf('async function pb1451RestoreLocal('),ui.indexOf('function pb1451RecoveryMessage('));new vm.Script(local);assert.match(local,/sourceFileId:original.id/);assert.match(local,/selection:detail.pb2091Selection/);
  assert.match(ui,/if\(required\)step\('صدور فاکتور',issued\)/);assert.match(ui,/invoiceVerified:invoiceIssued/);assert.match(ui,/invoiceRequired&&invoiceIssued\?'invoice':'download'/);
  assert.match(fs.readFileSync(root+'/index.html','utf8'),/archiveSelection=r2091&archiveReprint=r2085/);
 }
});
