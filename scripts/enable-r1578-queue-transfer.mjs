import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const js='photobridge-r1578-queue-transfer.js',css='photobridge-r1578-queue-transfer.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';let source=fs.readFileSync(path,'utf8');
 if(!source.includes('/* R1578 queue transfer cue */')){
  const anchor='Gt=async(le,nt)=>{const xt=nt==="ready"?"آماده تحویل"';if(source.split(anchor).length!==2)throw Error('R1578 queue navigation anchor changed');
  source=source.replace(anchor,`Gt=async(le,nt)=>{window.dispatchEvent(new CustomEvent('photobridge-queue-transfer',{detail:{from:T,to:nt,number:V(le.number)}}));const xt=nt==="ready"?"آماده تحویل"`);
  const stateAnchor='const pbLiveOrders=x.useRef';if(source.split(stateAnchor).length!==2)throw Error('R1578 order state anchor changed');source=source.replace(stateAnchor,'const [pb1578Pending,pb1578SetPending]=x.useState(null);'+stateAnchor);
  const actionStart=source.indexOf('aa=async(le,nt)=>'),actionEnd=source.indexOf(',la=(le,nt)=>',actionStart);if(actionStart<0||actionEnd<actionStart)throw Error('R1578 stage dispatcher changed');const oldAction=source.slice(actionStart+'aa=async(le,nt)=>'.length,actionEnd);source=source.slice(0,actionStart)+'aa=(le,nt)=>{if(E||pb1578Pending)return;return pb1578RunStage(le,nt,async()=>'+oldAction+',C,pb1578SetPending)}'+source.slice(actionEnd);
  const downloadLabel='?(E===le.id?(xt?.phase';if(source.split(downloadLabel).length!==2)throw Error('R1578 download label changed');source=source.replace(downloadLabel,'?(E===le.id&&!pb1578Pending?(xt?.phase');
  const buttonAnchor='disabled:!!E||(!pb1483Phone()&&!Bt),onClick:event=>';if(source.split(buttonAnchor).length!==2)throw Error('R1578 timeline button changed');source=source.replace(buttonAnchor,'"data-pb1578-stage":Jt.key,"aria-busy":pb1578Pending?.id===String(le.id)&&pb1578Pending?.stage===Jt.key?"true":undefined,disabled:!!E||!!pb1578Pending||(!pb1483Phone()&&!Bt),onClick:event=>');
  const children='children:[e.jsx("span",{className:"timelineDot",children:Zt?"✓":""}),e.jsx("b",{children:rt}),e.jsx("small",{children:xe?Yi(xe):Qe?"کلیک کن":"—"})]';if(source.split(children).length!==2)throw Error('R1578 timeline label changed');const active='pb1578Pending?.id===String(le.id)&&pb1578Pending?.stage===Jt.key';source=source.replace(children,'children:[e.jsx("span",{className:"timelineDot"+('+active+'?" pb1578Spinner":""),children:'+active+'?"":Zt?"✓":""}),e.jsx("b",{children:'+active+'?"در حال ثبت…":rt}),e.jsx("small",{children:'+active+'?"لطفاً صبر کنید":xe?Yi(xe):Qe?"کلیک کن":"—"})]');
  source+=`
async function pb1578RunStage(order,stage,work,mark,setPending){if(window.__pb1578StageFlight)return {busy:true};if(!['print','ready','completed','binding'].includes(stage))return work();const token={id:String(order.id),stage};window.__pb1578StageFlight=token;mark(order.id);setPending(token);try{return await work()}catch(error){if(typeof pb1547Notice==='function')pb1547Notice(error?.data?.message||error?.message||'ثبت مرحله انجام نشد؛ دوباره تلاش کنید.','warning');return {failed:true}}finally{if(window.__pb1578StageFlight===token)window.__pb1578StageFlight=null;mark('');setPending(null)}}
`;
source+='\n/* R1578 queue transfer cue */\n';fs.writeFileSync(path,source);
 }
 fs.copyFileSync('scripts/r1578-queue-transfer.js.txt',root+'/'+js);fs.copyFileSync('scripts/r1578-queue-transfer.css',root+'/'+css);
 const htmlPath=root+'/index.html';let html=fs.readFileSync(htmlPath,'utf8');if(!html.includes('/'+js+'?'))html=html.replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1578"><script defer src="/${js}?v=r1578"></script>\n</head>`);html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&queueCue=r1578')?url:url+'&queueCue=r1578');fs.writeFileSync(htmlPath,html);
 execFileSync(process.execPath,['--check',path],{stdio:'inherit'});execFileSync(process.execPath,['--check',root+'/'+js],{stdio:'inherit'});
}
const root='dist/web/lab-desktop-ui',path=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(path)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',js,css]){let row=manifest.files.find(item=>item.name===name);if(!row){row={name,url:'/lab-desktop-ui/'+name};manifest.files.push(row)}row.sha256=sha(fs.readFileSync(root+'/'+name))}manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(manifest));
