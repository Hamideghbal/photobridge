import fs from 'node:fs';
import path from 'node:path';
const file='dist/web/photobridge-r1126-desktop-navigation.js';
let code=fs.readFileSync(file,'utf8');
const replacements=[
  [
    " function cleanClone(original){",
    " // React can replace a native button without changing its HTML. Resolve at click time:\n // a retained desktop proxy must never dispatch to the detached, old React node.\n function printControlKey(button){\n  for(const name of ['photographerPrintPhotoTab','photographerPrintAlbumTab','photographerPrintTopLab','archive','finance'])if(button.classList.contains(name))return 'class:'+name;\n  if(button.id)return 'id:'+button.id;\n  return 'label:'+(button.getAttribute('aria-label')||button.textContent||'').replace(/\\s+/g,' ').trim();\n }\n function livePrintControl(key){\n  const doc=currentDocument(),header=doc&&nativeHeader(doc);\n  return [...(header?.querySelectorAll('.photographerPrintModeNav>button,.photographerPrintModeUtilityCluster button')||[])].find(button=>printControlKey(button)===key&&button.isConnected&&!button.disabled&&!button.hidden&&button.getAttribute('aria-hidden')!=='true');\n }\n function printControlSignature(button){\n  const key=printControlKey(button);\n  const label=key==='class:archive'?'آرشیو':key==='class:finance'?'مالی':(button.textContent||'').replace(/\\s+/g,' ').trim();\n  return [key,label,button.disabled,button.classList.contains('active'),button.getAttribute('aria-current')];\n }\n function cleanClone(original){"
  ],
  [
    "visible.map(el=>el.outerHTML).join('')",
    "(active==='print'?JSON.stringify(visible.map(printControlSignature)):visible.map(el=>el.outerHTML).join(''))"
  ],
  [
    "    copy.onclick=()=>{press(copy);original.click();requestAnimationFrame(()=>reveal(motionContent(doc)));};",
    "    const printKey=active==='print'?printControlKey(original):null;\n    copy.onclick=()=>{const target=printKey?livePrintControl(printKey):original;if(!target||target.disabled)return;press(copy);target.click();requestAnimationFrame(()=>reveal(motionContent(currentDocument())));};"
  ]
  ,[
    "new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});",
    "new MutationObserver(records=>{if(records.some(record=>!chrome?.contains(record.target)))schedule();}).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});"
  ]
];
if(!code.includes('function livePrintControl(key)')){
 for(const [before,after]of replacements){
  if(code.split(before).length!==2)throw Error('R1307 desktop navigation anchor missing or ambiguous');
  code=code.replace(before,after);
 }
 fs.writeFileSync(file,code);
}
function refreshHtml(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory())refreshHtml(file);
  else if(item.name.endsWith('.html')){
   const html=fs.readFileSync(file,'utf8');
   const next=html.replace(/(photobridge-r1126-desktop-navigation\.js)([^"'<>\s]*)/g,(_,name,query)=>name+query.replace(/([?&])printNav=[^&]*/g,'$1').replace(/[?&]$/,'')+(query.includes('?')?'&':'?')+'printNav=r1307');
   if(next!==html)fs.writeFileSync(file,next);
  }
 }
}
refreshHtml('dist/web');refreshHtml('dist/api');
console.log('[PhotoBridge R1307] desktop Print proxies resolve connected native controls.');
