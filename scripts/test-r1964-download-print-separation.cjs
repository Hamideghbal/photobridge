'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const marker='/* PB1964 DOWNLOAD IS NOT PRINT */';
const asset='assets/index-UIRefine-v655-r84.js';
const source=fs.readFileSync('dist/api/server.js','utf8');
const start=source.indexOf('const labAlbumDownloadComplete =');
const end=source.indexOf('const labPaymentReceipt =',start);
const endpoint=source.slice(start,end);
function part(ui,from,to){
 const i=ui.indexOf(from),j=i<0?-1:ui.indexOf(to,i+from.length);
 assert(i>=0&&j>i,from+' section exists');
 return ui.slice(i,j);
}
function stage(ui,mode){
 const expr=part(ui,'rn=(le,nt)=>',',en=(le,nt)=>').slice('rn='.length);
 const ctx={o:mode,pb1798NoPrintOrder:()=>false,kn:(row,statuses)=>statuses.includes(row.status)||(row.status_history||[]).some(item=>statuses.includes(item.status))};
 return vm.runInNewContext('('+expr+')',ctx);
}
test('R1964: album download acknowledgement changes only downloaded status, never print stage',()=>{
 assert(source.includes(marker));
 assert(endpoint.includes("ELSE 'files_received' END"),'album download leaves operator printing stage pending');
 assert(endpoint.includes("ELSE 'downloaded' END"),'album download saves downloaded workflow status');
 assert(endpoint.includes("album_stage IN ('printing','binding','ready','completed')"),'do not regress actual print');
 assert(!endpoint.includes("ELSE 'printing' END"),'download alone never starts print');
 assert(!endpoint.includes('ورود به مرحله چاپ'),'download notice does not claim printing started');
});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 test('R1964: separate operator print controls in '+root,()=>{
  const ui=fs.readFileSync(root+'/'+asset,'utf8');
  assert(ui.includes(marker));
  assert(ui.includes('const R0=[{value:"download",label:"دانلود"},{value:"print",label:"شروع چاپ"},'));
  assert(ui.includes('nt==="print"&&rn(le,"download")&&!rn(le,"print")?Cn(le,"printing")'),
     'only operator print button invokes album-stage printing');
  const print=stage(ui,'print');
  const received={id:'p',status:'downloaded',invoice_id:'invoice',downloaded_at:'2026-11-23T00:00:00Z',status_history:[{status:'downloaded'}]};
  assert.equal(print(received,'download'),true);
  assert.equal(print(received,'print'),false,'issued invoice and verified download never imply print');
  assert.equal(print({...received,status:'printing'},'print'),true);
  const album=stage(ui,'album');
  const albumReceived={...received,mode:'album',album_stage:'files_received'};
  assert.equal(album(albumReceived,'download'),true);
  assert.equal(album(albumReceived,'print'),false,'album download cannot start print');
  assert.equal(album(albumReceived,'binding'),false,'album binding cannot begin before operator starts print');
  assert.equal(album({...albumReceived,status:'printing',album_stage:'printing'},'print'),true);
  const enabledExpr=part(ui,'la=(le,nt)=>',',Wn=async').slice('la='.length);
  const la=vm.runInNewContext('('+enabledExpr+')',{o:'album',rn:album,pb1798NoPrintOrder:()=>false,pb1603InvoicePending:()=>false,pb1450CanDownload:()=>true});
  assert.equal(la(albumReceived,'print'),true,'operator may explicitly start print after download');
  assert.equal(la(albumReceived,'binding'),false);
  assert.equal(la({...albumReceived,status:'printing',album_stage:'printing'},'binding'),true);
 });
}
test('R1964: native UI manifest matches final release bytes',()=>{
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of [asset,'index.html']){
  const item=manifest.files.find(f=>f.name===name);
  assert(item,'manifest entry '+name);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex');
  assert.equal(item.sha256,actual,name+' stale snapshot');
 }
});
