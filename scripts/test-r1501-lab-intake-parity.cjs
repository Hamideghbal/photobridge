'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'enable-r1501-lab-intake-parity.mjs');
const jsSource=`let entries=[],groups=[],pendingFiles=[],order=null,submitting=false,locked=false,startedAt=null;
const selectPhotos=async mode=>{const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;choose.textContent='کپی عکس';}};
fileInput.onchange=()=>{pendingFiles=[...fileInput.files];choose.textContent=pendingFiles.length?'انتخاب عکس‌ها':'';};
async function appendFiles(group,files,size,paper){
const additions=[];
for(const file of files){const hash=await digest(file);const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper},albumMode,group.paper))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper},albumMode,group.paper));if(item){additions.push({existing:item,sourceFile:file});}else additions.push({file,hash,size,paper,copies:1,chassis:false});}
for(const item of additions){if(item.existing){window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;continue;}item.id=crypto.randomUUID();item.preview=URL.createObjectURL(item.file);group.items.push(item);}
}
const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);photo.append(frame,node('figcaption',item.file.name));
const addMore=async mode=>{const files=await window.pb1466IntakeMove.pick(mode);if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper);syncEntries();renderGroups();};
input.onchange=async()=>{try{await appendFiles(group,input.files,group.size,group.paper);syncEntries();renderGroups();}catch(e){error.textContent=e.message;}};
await appendFiles(group,pendingFiles,defaultSize.value,defaultPaper.value);
quantity.append(minus,count,plus);photo.append(quantity);`;
test('manual-order photo-action badges, visible quantities and paper controls are bundled to browser and desktop UI',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pb-r1501-'));
 try{
  const web=path.join(root,'dist/web');fs.mkdirSync(web,{recursive:true});
  fs.writeFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'.pb1137Intake .pb1139GroupPhotos{overflow-y:hidden}\n');
  fs.writeFileSync(path.join(web,'photobridge-r1137-lab-local-intake.js'),jsSource);
  fs.writeFileSync(path.join(web,'index.html'),'<link rel="stylesheet" href="/photobridge-r1137-lab-local-intake.css?v=r1500-manual-order-quantity"><script src="/photobridge-r1137-lab-local-intake.js?v=r1470-native-intake"></script>');
  cp.execFileSync(process.execPath,[script],{cwd:root});
  const css=fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'utf8');
  const js=fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.js'),'utf8');
  const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
  assert.match(css,/PB1501 manual-order parity/);
  assert.match(css,/figure\{display:flex!important;flex:0 0 148px!important/);
  assert.match(css,/\.pb1501ActionBadge\[data-action="move"\]/);
  assert.match(css,/\.pb1141PhotoActions>\.pb1180IntakePaper/);
  assert.match(css,/\.pb1142Quantity>span\{display:inline!important/);
  assert.match(js,/pendingAction='copy'/);
  assert.match(js,/pendingAction=mode/);
  assert.match(js,/PB1501 per-photo action labels/);
  assert.match(js,/sourceActions\.includes\(item\.sourceAction\)/);
  assert.match(js,/await appendFiles\(group,files,group\.size,group\.paper,mode\)/);
  assert.match(js,/await appendFiles\(group,input\.files,group\.size,group\.paper,'copy'\)/);
  assert.match(js,/modeLabel=modes\.includes\('copy'\)&&modes\.includes\('move'\)/);
  assert.match(js,/quantity\.append\(node\('span','تعداد'\),minus,count,plus\)/);
  assert.match(html,/photobridge-r1137-lab-local-intake\.css\?v=r1501-manual-intake-parity/);
  assert.match(html,/<script[^>]*src="\/photobridge-r1137-lab-local-intake\.js\?v=r1501-manual-intake-parity"/);
  cp.execFileSync(process.execPath,[script],{cwd:root});
  assert.equal(fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.css'),'utf8').split('PB1501 manual-order parity').length-1,1);
  assert.equal(fs.readFileSync(path.join(web,'photobridge-r1137-lab-local-intake.js'),'utf8').split('PB1501 per-photo action labels').length-1,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
