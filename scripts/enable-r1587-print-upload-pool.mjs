import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PB1587runUploadPool}=require('./r1587-upload-pool.cjs');

const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
let js=fs.readFileSync(bundle,'utf8');
const begin='let ge=0;for(const bt of E.current){const Nt=Zv(bt.label);for(const tt of bt.files){';
const end='}}ye();const Be=await Me('+String.fromCharCode(96);
if(js.includes('PB1587runUploadPool=')){
  if(js.includes(begin))throw new Error('R1587 both old and new print submit paths are present');
  console.log('R1587 bounded print uploads already installed');
}else{
  const count=js.split(begin).length-1;
  if(count!==1)throw new Error('R1587 expected exactly one print loop, got '+count);
  const start=js.indexOf(begin),finish=js.indexOf(end,start);
  if(finish<0)throw new Error('R1587 print loop closing anchor not found');
  const old=js.slice(start,finish+2);
  for(const required of [
    '/api/customer/uploads/presign', '/api/customer/uploads/complete',
    'printCopies:pbPrintCopies(tt)', 'cropHandling:"lab"',
    'rs(Gt.uploadUrl,tt.file', 'ue.signal', 'ke(bt.id,tt.id,100)'
  ])if(!old.includes(required))throw new Error('R1587 print loop changed: missing '+required);
  const replacement=[
    'const PB1587runUploadPool=('+PB1587runUploadPool.toString()+');',
    'const PB1587jobs=E.current.flatMap(bt=>bt.files.map(tt=>({bt,tt}))).filter(({tt})=>!y.current.has(tt.id));',
    'const PB1587progress=new Map();',
    'const PB1587update=(id,value)=>{PB1587progress.set(id,Math.max(0,Math.min(100,Number(value)||0)));const all=[...PB1587progress.values()].reduce((sum,n)=>sum+n,0);be(Math.min(99,Math.round(all/Math.max(1,I.current))))};',
    'const PB1587uploadOne=async({bt,tt})=>{',
    '  ye();',
    '  S.current.add(tt.id);',
    '  ke(bt.id,tt.id,1);',
    '  PB1587update(tt.id,0);',
    '  const Nt=Zv(bt.label),_t=tt.paperOverride||bt.paperType,',
    '    yt=Wr(bt,tt,"chassis"),Tt=Wr(bt,tt,"frame"),',
    '    Wt=String(tt.relativePath||tt.file.name).replace(/^\\/+/, "");',
    '  const Gt=await Me("/api/customer/uploads/presign",{',
    '    method:"POST",body:JSON.stringify({orderId:P.id,name:tt.file.name,printCopies:pbPrintCopies(tt),',
    '      relativePath:Nt+"/"+Wt,',
    '      bytes:tt.file.size,contentType:tt.file.type||"application/octet-stream",',
    '      width:tt.width||null,height:tt.height||null,dpi:tt.dpi||null,',
    '      printSizeId:bt.sizeId==="__custom__"?null:bt.sizeId,',
    '      customSize:bt.sizeId==="__custom__"?bt.customSize:void 0,',
    '      printType:_t,chassis:yt,frame:Tt,cropHandling:"lab"})',
    '  });',
    '  ye();',
    '  await rs(Gt.uploadUrl,tt.file,on=>{',
    '    const current=Math.max(1,Math.min(90,Math.round(on*.9)));',
    '    ke(bt.id,tt.id,current);',
    '    PB1587update(tt.id,current);',
    '  },ue.signal);',
    '  ye();',
    '  await Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId:Gt.fileId})});',
    '  ye();',
    '  ke(bt.id,tt.id,100);',
    '  PB1587update(tt.id,100);',
    '};',
    'await PB1587runUploadPool(PB1587jobs,E.current.some(bt=>bt.sizeId==="__custom__")?1:3,PB1587uploadOne);'
  ].join('\n');
  js=js.slice(0,start)+replacement+js.slice(finish+2);
  if(js.includes(begin)||!js.includes('await PB1587runUploadPool(PB1587jobs,E.current.some(bt=>bt.sizeId==="__custom__")?1:3,PB1587uploadOne)'))throw new Error('R1587 patch verification failed');
  fs.writeFileSync(bundle,js);
  console.log('R1587 print upload pool installed, max 3 concurrent, awaiting all active requests on failure');
}
