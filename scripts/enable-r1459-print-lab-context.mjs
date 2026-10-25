import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(uiFile,'utf8');
const replaceOnce=(text,a,b)=>{if(text.split(a).length!==2)throw Error('R1459 anchor '+a.slice(0,100));return text.replace(a,b)};
if(!ui.includes('/* PB1459 lab context */')){
 ui=replaceOnce(ui,'e.jsx("div",{className:"photographerPrintTopLab",children:d.length>1?', 'e.jsxs("div",{className:"photographerPrintTopLab",children:[e.jsx("select",{hidden:true,className:"pb1459LabSource","data-lab-name":p?.lab?.name||"لابراتوار",value:_e,disabled:W,onChange:event=>(je?A:_)(event.target.value),children:d.map(option=>e.jsx("option",{value:option.value,disabled:option.disabled,children:option.label},option.value))}),d.length>1?');
 ui=replaceOnce(ui,'className:"photographerPrintTopLabStatic",children:((Pt=p.lab)==null?void 0:Pt.name)||"لابراتوار"})}),!!((Te=p.lab)', 'className:"photographerPrintTopLabStatic",children:((Pt=p.lab)==null?void 0:Pt.name)||"لابراتوار"})]}),!!((Te=p.lab)');
 ui+='\n/* PB1459 lab context */\n';fs.writeFileSync(uiFile,ui);
}
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(navFile,'utf8');
if(!nav.includes('/* PB1459 lab context */')){
 const helper=` /* PB1459 lab context */
 function pb1459LabContext(source){
  const context=document.createElement('div');context.className='pb1459LabContext';context.setAttribute('aria-label','لابراتوار انتخاب‌شده');
  const name=source.dataset.labName||source.selectedOptions[0]?.textContent||'لابراتوار';context.title=name;
  if(source.options.length>1){
   const select=document.createElement('select');select.className='pb1459LabSelect';select.setAttribute('aria-label','تغییر لابراتوار چاپ');
   for(const option of source.options)select.append(option.cloneNode(true));select.value=source.value;select.disabled=source.disabled;
   select.onchange=()=>{const live=currentDocument()?.querySelector('select.pb1459LabSource');if(!live||live.disabled)return;const option=[...live.options].find(o=>o.value===select.value&&!o.disabled);if(!option)return;live.value=option.value;live.dispatchEvent(new live.ownerDocument.defaultView.Event('change',{bubbles:true}));schedule();};context.append(select);
  }else{const title=document.createElement('strong');title.textContent=name;context.append(title)}
  return context;
 }
`;
 nav=replaceOnce(nav,' function cleanClone(original)',helper+' function cleanClone(original)');
 nav=replaceOnce(nav,"  const sources=choosing?[]:","  const pb1459LabSource=active==='print'&&!choosing?doc?.querySelector('select.pb1459LabSource'):null;\n  const pb1459LabSignature=pb1459LabSource?JSON.stringify([pb1459LabSource.outerHTML,pb1459LabSource.value,pb1459LabSource.disabled]):'';\n  const sources=choosing?[]:");
 nav=replaceOnce(nav,"  const signature=active+'|'", "  const signature=pb1459LabSignature+'|'+active+'|'");
 nav=replaceOnce(nav,'row.append(modes,utilities);', 'row.append(modes);if(pb1459LabSource)row.append(pb1459LabContext(pb1459LabSource));row.append(utilities);');
 fs.writeFileSync(navFile,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');
// Remove superseded R1458 rules as well when running against an existing built tree.
css=css.replace(' html body #pb1126ChromeHost #pb1126DesktopHeader.pb1458PrintToolbar>.photographerHeaderIdentity{display:none!important}\n','');
if(!css.includes('/* PB1459 lab context */')){css+='\n/* PB1459 lab context */\n'+fs.readFileSync('scripts/r1459-print-lab-context.css','utf8');}fs.writeFileSync(cssFile,css);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.(?:css|js)\?[^"'\s]*)/g,url=>url.includes('labContext=r1459')?url:url+'&labContext=r1459');html=html.replaceAll('downloadRepair=r1458','downloadRepair=r1459');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});console.log('[R1459] Lab context centered in second header, intake action at right, original photographer identity restored.');
