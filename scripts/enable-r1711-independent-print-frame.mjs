// R1711 independent print-frame orientation in Lab image editor (web + native).
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1711 '+label+' anchor count '+n);return s.replace(a,b)};
const css='\n/* R1711 independent print frame orientation */\n.imageEditorControls .pbR1711FrameRotate{display:grid;gap:6px;grid-column:1/-1;padding:9px 10px;border:1px solid #cbd8ea;background:#f4f8ff;border-radius:11px;margin-bottom:8px;min-width:0}\n.imageEditorControls .pbR1711FrameRotate b{font-size:11px;font-weight:900;color:#1d3b66}\n.imageEditorControls .pbR1711FrameRotate button{display:block;width:100%;min-height:35px;border:1px solid #8daee4;background:#fff;color:#153c7b;font-size:11px;font-weight:850;border-radius:8px;cursor:pointer;line-height:1.7}\n.imageEditorControls .pbR1711FrameRotate button:disabled{opacity:.55;cursor:default}\n.imageEditorControls .pbR1711FrameRotate small{font-size:9px;line-height:1.6;color:#526782}\n';
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const jsPath=root+'/assets/index-UIRefine-v655-r84.js';
 let js=fs.readFileSync(jsPath,'utf8');
 if(!js.includes('/*PB_R1711_INDEPENDENT_FRAME_ORIENTATION*/')){
  const start=js.indexOf('function rb({item:t,d:a,onClose:s,onSave:r})');
  const end=js.indexOf('function Vc(t)',start);
  if(start<0||end<=start)throw Error('R1711 editor not found: '+root);
  let edit=js.slice(start,end);
  edit=one(edit,'[M,B]=x.useState(!1),L=x.useRef(null),J=Nc(t,a)','[M,B]=x.useState(!1),[G,Q]=x.useState(()=>Number(t.width||0)>=Number(t.height||0)),L=x.useRef(null),J=Nc(t,a)','frame state');
  edit=one(edit,'be=ie>=K?me:1/me','be=G?me:1/me','independent frame aspect');
  edit=one(edit,'[l,m,p,h,y,T,E,w,t.sizeId]','[l,m,p,h,y,T,E,w,t.sizeId,G]','frame preview effect');
  edit=one(edit,'children:"↶ ۹۰°"','children:"↶ ۹۰° عکس"','photo rotate left');
  edit=one(edit,'children:"۹۰° ↷"','children:"عکس ۹۰° ↷"','photo rotate right');
  edit=one(edit,'k(100),C(100),F(100),g(0)},children:"بازنشانی"','k(100),C(100),F(100),g(0),Q(Number(t.width||0)>=Number(t.height||0))},children:"بازنشانی"','reset');
  const frameControls='e.jsxs("div",{className:"pbR1711FrameRotate",children:[e.jsx("b",{children:"چرخش قاب سایز چاپ"}),e.jsx("button",{type:"button",disabled:me===1,onClick:()=>Q(O=>!O),title:"تغییر جهت قاب بدون چرخاندن عکس",children:G?"▭ قاب افقی · چرخش قاب ↻":"▯ قاب عمودی · چرخش قاب ↻"}),e.jsx("small",{children:me===1?"قاب این سایز مربع است؛ جهت آن تغییری ندارد.":"چرخش قاب مستقل از چرخش عکس است."})]}),';
  edit=one(edit,'e.jsxs("aside",{className:"imageEditorControls",children:[e.jsxs("div",{className:"editorQuick",children:[','e.jsxs("aside",{className:"imageEditorControls",children:['+frameControls+'e.jsxs("div",{className:"editorQuick",children:[','frame button');
  js=js.slice(0,start)+'/*PB_R1711_INDEPENDENT_FRAME_ORIENTATION*/\n'+edit+js.slice(end);
  fs.writeFileSync(jsPath,js);
 }
 execFileSync(process.execPath,['--check',jsPath],{stdio:'inherit'});
 const cssPath=root+'/assets/index-UIRefine-v586.css';if(fs.existsSync(cssPath)){const prior=fs.readFileSync(cssPath,'utf8');if(!prior.includes('.pbR1711FrameRotate{'))fs.writeFileSync(cssPath,prior+css)}
 const htmlPath=root+'/index.html';let html=fs.readFileSync(htmlPath,'utf8');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,s=>s.includes('&frameRotate=r1711')?s:s+'&frameRotate=r1711');
 html=html.replace(/(index-UIRefine-v586\.css\?[^"']*)/g,s=>s.includes('&frameRotate=r1711')?s:s+'&frameRotate=r1711');
 fs.writeFileSync(htmlPath,html);
 if(root.endsWith('lab-desktop-ui')){
  const mp=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(mp,'utf8'));
  for(const name of ['assets/index-UIRefine-v655-r84.js','assets/index-UIRefine-v586.css','index.html']){
   const row=manifest.files.find(x=>x.name===name);
   if(!row)throw Error('R1711 manifest entry missing: '+name);
   row.sha256=digest(fs.readFileSync(root+'/'+name));
  }
  manifest.build=digest(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(mp,JSON.stringify(manifest));
 }
}
console.log('[R1711] lab photo rotation and print-frame orientation work independently; preview, cropped output, CSS and native hashes updated.');
