'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
function geometry(source,{m=0,width=1200,height=800,ratio=1.5,zoom=1,landscape=true}={}){
 const start=source.indexOf('function rb({item:t,d:a,onClose:s,onSave:r})');
 const end=source.indexOf('function Vc(t)',start);
 assert(start>=0&&end>start,'R1711 editor still exists');
 const edit=source.slice(start,end),a=edit.indexOf('ae=()=>{'),b=edit.indexOf('};x.useEffect',a);
 assert(a>=0&&b>a,'R1711 crop function still exists');
 const body=edit.slice(a+7,b+1);
 return Function('m','t','me','p','h','y','G',`return (()=>${body})()`)(m,{width,height},ratio,zoom,.5,.5,landscape);
}
test('R1711 independent frame orientation survives in website and Lab desktop snapshot',()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const source=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const css=fs.readFileSync(root+'/assets/index-UIRefine-v586.css','utf8');
  const index=fs.readFileSync(root+'/index.html','utf8');
  for(const mark of ['/*PB_R1711_INDEPENDENT_FRAME_ORIENTATION*/','pbR1711FrameRotate','چرخش قاب سایز چاپ','چرخش قاب مستقل از چرخش عکس','onClick:()=>Q(O=>!O)','onClick:()=>g(O=>(O+90)%360)','be=G?me:1/me','[l,m,p,h,y,T,E,w,t.sizeId,G]'])assert(source.includes(mark),root+' '+mark);
  assert(css.includes('.pbR1711FrameRotate{'),root);
  assert(index.includes('&frameRotate=r1711'),root);
  for(const rotation of [0,90,180,270]){
   const l=geometry(source,{m:rotation,landscape:true}),p=geometry(source,{m:rotation,landscape:false});
   assert(l.cw>l.ch && p.cw<p.ch,'frame aspect independent of image rotation');
   assert.equal(l.quarter,p.quarter,'frame rotation never rotates pixels');
   for(const v of [l,p])assert(v.x>=0&&v.y>=0&&v.x+v.cw<=v.rw&&v.y+v.ch<=v.rh,'crop stays inside input');
  }
  if(root.endsWith('lab-desktop-ui')){
   const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
   const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
   for(const file of ['assets/index-UIRefine-v655-r84.js','assets/index-UIRefine-v586.css','index.html'])assert.equal(manifest.files.find(x=>x.name===file)?.sha256,hash(fs.readFileSync(root+'/'+file)),file);
   assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
  }
 }
});
