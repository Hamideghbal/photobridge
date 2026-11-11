'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');

const recovery=fs.readFileSync('scripts/r1451-archive-recovery.js','utf8');
const thermal=fs.readFileSync('scripts/r1698-approved-site-thermal.js.txt','utf8');
const download=fs.readFileSync('scripts/r1450-download-workflow.js','utf8');

function receiptHarness(){
 const a=recovery.indexOf('function pb1772ReceiptFile(');
 const b=recovery.indexOf('async function pb1451AcknowledgeDownload(',a);
 assert(a>=0&&b>a&&b-a<2600,'canonical receipt helper must be present');
 const ctx={pb1450Meta(file,all){
  const r=all[String(file.id)];
  return r&&r.serverName===file.original_name&&r.serverBytes===Number(file.bytes)
   ?{...file,original_name:r.name,bytes:r.bytes}:file;
 }};
 vm.createContext(ctx);
 vm.runInContext(recovery.slice(a,b),ctx);
 return ctx.pb1772ReceiptFile;
}
const photo=(args={})=>({id:'file-1',original_name:'DSC 001.jpg',bytes:250,source_original_name:'DSC 001.jpg',...args});
const receipt=(name,bytes,extra={})=>({'file-1':{serverName:'DSC 001.jpg',serverBytes:250,name,bytes,...extra}});
test('R1772: original server identity is separate from disk name for a single-copy image',()=>{
 const toServer=receiptHarness();
 const orderFile=photo();
 const p=toServer(orderFile,receipt('dsc-001.jpg',250));
 assert.equal(p.id,'file-1');
 assert.equal(p.name,'DSC 001.jpg');
 assert.equal(p.bytes,250);
 assert.notEqual(p.name,'dsc-001.jpg');
});
test('R1772: exact-copy disk suffix does not leak into server receipt',()=>{
 const toServer=receiptHarness();
 const p=toServer(photo({print_copies:5}),receipt('dsc-001 = 5.jpg',250));
 assert.equal(p.name,'DSC 001.jpg');
 assert.equal(p.bytes,250);
});
test('R1772: source HEIC fallback with different bytes preserves the transferred identity',()=>{
 const toServer=receiptHarness();
 const detail=photo({original_name:'DSC 001.jpg',bytes:250,source_original_name:'DSC 001.HEIC'});
 const r={'file-1':{serverName:'DSC 001.jpg',serverBytes:250,name:'dsc-001.heic',bytes:900,
  transportName:'DSC 001.HEIC',transportBytes:900}};
 assert.equal(toServer(detail,r).name,'DSC 001.HEIC');
 assert.equal(toServer(detail,r).bytes,900);
 const legacy={'file-1':{serverName:'DSC 001.jpg',serverBytes:250,name:'dsc-001.heic',bytes:900}};
 assert.equal(toServer(detail,legacy).name,'DSC 001.HEIC');
});
test('R1772: saved disk files remain verified before any server acknowledgement',()=>{
 assert.match(download,/await pb1450Verify\(detail,root,receipts,progress\)/);
 assert.match(download,/if \(!report.complete\) throw Object.assign\(Error\('local_download_incomplete'\)/);
 assert.match(download,/transportName:response\.pbDownloadName \|\| file\.original_name/);
 assert.match(recovery,/pb1451LiveRecovery\('\/api\/lab\/orders\/'\+detail\.order\.id\+'\/download-receipt'/);
});
test('R1772: server still rejects invalid or incomplete file receipts',async()=>{
 const {downloadFilesMatch}=await import('../dist/api/lab-download-receipt.js');
 const rows=[{id:'file-1',original_name:'DSC 001.HEIC',bytes:900,print_name:'DSC 001.jpg',print_bytes:250},
             {id:'file-2',original_name:'portrait.jpg',bytes:300}];
 const yes=[{id:'file-1',name:'DSC 001.jpg',bytes:250},{id:'file-2',name:'portrait.jpg',bytes:300}];
 assert.equal(downloadFilesMatch(rows,yes),true);
 assert.equal(downloadFilesMatch(rows,[{...yes[0],name:'DSC 001.HEIC',bytes:900},yes[1]]),true);
 for(const invalid of [
  yes.slice(0,1),
  [{...yes[0],name:'dsc-001.jpg'},yes[1]],
  [{...yes[0],bytes:249},yes[1]],
  [yes[0],yes[0]],
  [yes[0],{...yes[1],name:'portrait = 1.jpg'}]
 ]) assert.equal(downloadFilesMatch(rows,invalid),false);
});
test('R1772: thermal item lines explicitly retain chassis and frame flags',()=>{
 const ctx={};vm.createContext(ctx);vm.runInContext(thermal,ctx);
 const invoice={lab_name:'Test Lab',number:42,customer_name:'Customer',items:[
  {sizeLabel:'10×15',printTypeLabel:'luster',chassis:true,quantity:1,unitPrice:1000,lineTotal:1000},
  {description:'20×30 · شاسی',chassis:true,quantity:1,unitPrice:2000,lineTotal:2000},
  {description:'30×40',frame:true,quantity:1,unitPrice:3000,lineTotal:3000},
  {description:'simple print',chassis:false,frame:false,quantity:1,unitPrice:1000,lineTotal:1000}
 ],total:7000,subtotal:7000};
 const html=ctx.pbR1698ApprovedThermal(invoice,true);
 assert.match(html,/10×15.*شاسی/);
 assert.match(html,/20×30 · شاسی/);
 assert.doesNotMatch(html,/شاسی · شاسی/);
 assert.match(html,/30×40 · قاب/);
 assert.match(html,/simple print/);
});
test('R1772: final site and native UI carry matching receipt logic and thermal text',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(js.includes('function pb1772ReceiptFile('),root+' receipt helper');
  assert(js.includes('transportName:response.pbDownloadName || file.original_name'),root+' transfer identity');
  assert(js.includes("if(x.chassis===true&&!/(شاسی|chassis)/i.test(baseLabel))"),root+' thermal chassis');
  assert(js.includes("const label=baseLabel+(additions.length?' · '+additions.join(' · '):'')"),root+' thermal item label');
  const manifestPath=root+'/manifest.json';
  if(fs.existsSync(manifestPath)){
   const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
   for(const n of ['index.html','assets/index-UIRefine-v655-r84.js']){
    const item=m.files.find(x=>x.name===n);
    assert(item,'missing native '+n);
    assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+n)).digest('hex'));
   }
  }
 }
});
