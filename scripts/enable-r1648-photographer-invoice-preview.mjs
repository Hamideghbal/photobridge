/* R1648: desktop photographer invoice preview and header stability. Presentation only. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const once=(src,from,to,label)=>{const count=src.split(from).length-1;if(count!==1)throw Error('R1648 '+label+' count '+count);return src.replace(from,to);};
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const stylesheet='photobridge-r1648-photographer-invoice.css';

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const bundle=root+'/assets/index-UIRefine-v655-r84.js';
 let source=fs.readFileSync(bundle,'utf8');
 if(!source.includes('/* PB1648 photographer invoice portal */')){
  const start=source.indexOf('function Oc({role:t,invoice:a,onClose:s}){');
  const end=source.indexOf('function tj(',start);
  if(start<0||end<=start||end-start>11000)throw Error('R1648 invoice preview function boundary '+root);
  let component=source.slice(start,end);
  component=once(component,
   'const h=document.body.style.overflow;document.body.style.overflow="hidden";const S=y=>{y.key==="Escape"&&s()};return window.addEventListener("keydown",S),()=>{document.body.style.overflow=h,window.removeEventListener("keydown",S)}',
   'const body=pb1648InvoicePortal(t).ownerDocument.body,h=body.style.overflow;body.style.overflow="hidden";const keyWin=body.ownerDocument.defaultView||window,S=y=>{y.key==="Escape"&&s()};return keyWin.addEventListener("keydown",S),()=>{body.style.overflow=h,keyWin.removeEventListener("keydown",S)}',
   'escape and host scroll lock');
  component=once(component,
   'F=Math.min(1,k/C,E/w);f(Math.max(.58,F))',
   'F=t==="customer"&&pb1648InvoicePortal(t)!==document.body?Math.min(1.12,k/C):Math.min(1,k/C,E/w);f(Math.max(.58,F))',
   'customer preview scale');
  if(!component.endsWith(',document.body)'))throw Error('R1648 unexpected preview portal suffix '+root);
  component=component.slice(0,-',document.body)'.length)+',pb1648InvoicePortal(t))';
  const helper=[
   'function pb1648InvoicePortal(role){',
   ' if(role==="customer"&&window.parent!==window&&new URLSearchParams(location.search).get("pbDesktopContent")==="1"){',
   '  try{const p=window.parent.document;if(p?.body&&p.documentElement.classList.contains("pb1126Desktop"))return p.body;}catch{}',
   ' }',
   ' return document.body;',
   '}'
  ].join('\n');
  source=source.slice(0,start)+helper+component+source.slice(end);
  source+='\n/* PB1648 photographer invoice portal */\n';
  fs.writeFileSync(bundle,source);
 }
 execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});

 const navPath=root+'/photobridge-r1126-desktop-navigation.js';
 let nav=fs.readFileSync(navPath,'utf8');
 if(!nav.includes('/* PB1648 stable print header */')){
  nav=once(nav,
    "visible.map(el=>el.outerHTML).join('')",
    "visible.map(el=>el.tagName+'|'+[...el.classList].filter(c=>!['active','loading','pending'].includes(c)).join('.')+'|'+el.textContent.trim()).join('|')",
    'ignore temporary nav status in structural signature');
  const stable=[
   '   row.dataset.source=signature;',
   '  }',
   '  /* PB1648 stable print header: refresh proxy buttons without rebuilding them. */',
   "  if(active==='print'&&!choosing&&!storeHeader){",
   "   const copies=[...row.querySelectorAll('.pb1127PrintModes>button')];",
   '   visible.forEach((original,index)=>{',
   '    const copy=copies[index];if(!copy)return;',
   "    copy.classList.toggle('active',original.classList.contains('active'));",
   '    copy.disabled=Boolean(original.disabled);',
   "    for(const attr of ['aria-current','aria-selected']){",
   '     const value=original.getAttribute(attr);',
   '     if(value===null)copy.removeAttribute(attr);else copy.setAttribute(attr,value);',
   '    }',
   '    copy.onclick=()=>{',
   '     const d=currentDocument(),h=nativeHeader(d);',
   "     const live=[...(h?.querySelectorAll('.photographerPrintModeNav>button,.photographerPrintModeUtilityCluster button')||[])]",
   "       .filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&!el.classList.contains('photographerPrintModeBack'));",
   '     live[index]?.click();schedule();',
   '    };',
   '   });',
   '  }'
  ].join('\n');
  nav=once(nav,'   row.dataset.source=signature;\n  }',stable,'in-place header sync');
  nav=once(nav,'const thirdVisible=controls.length>0;',
   "const financeTabSelected=Boolean(native?.querySelector('.photographerPrintModeUtilityCluster button.finance.active'));\n  const thirdVisible=controls.length>0||(financeTabSelected&&financeThird.children.length>0);",
   'finance third bar stays stable through transient reloads');
  nav=once(nav,
   "new MutationObserver(schedule).observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});",
   "frame._pb1648HeaderObserver?.disconnect();frame._pb1648HeaderObserver=new MutationObserver(schedule);frame._pb1648HeaderObserver.observe(frame.contentDocument.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','disabled','aria-current']});",
   'deduplicate frame observer on reload');
  fs.writeFileSync(navPath,nav);
 }
 execFileSync(process.execPath,['--check',navPath],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1648-photographer-invoice.css',root+'/'+stylesheet);
 const htmlPath=root+'/index.html';
 let html=fs.readFileSync(htmlPath,'utf8');
 if(!html.includes(stylesheet))html=once(html,'</head>','<link rel="stylesheet" href="/'+stylesheet+'?v=r1648"></head>','invoice stylesheet');
 let bundleCount=0,navCount=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,url=>{bundleCount++;return url.includes('photoInvoice=r1648')?url:url+'&photoInvoice=r1648';});
 html=html.replace(/photobridge-r1126-desktop-navigation\.js\?[^"']*/g,url=>{navCount++;return url.includes('invoiceStability=r1648')?url:url+'&invoiceStability=r1648';});
 if(bundleCount!==1||navCount!==1||!html.includes('photoInvoice=r1648')||!html.includes('invoiceStability=r1648'))throw Error('R1648 missing cache barriers '+root);
 fs.writeFileSync(htmlPath,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(manifest.channel!=='lab'||manifest.protocol!==1||!Array.isArray(manifest.files))throw Error('R1648 invalid native manifest');
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1126-desktop-navigation.js',stylesheet]){
   let item=manifest.files.find(f=>f.name===name);
   if(!item){item={name,url:'/lab-desktop-ui/'+name};manifest.files.push(item);}
   item.sha256=sha256(fs.readFileSync(root+'/'+name));
  }
  manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  manifest.build=sha256(JSON.stringify(manifest.files));
  manifest.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestPath,JSON.stringify(manifest));
 }
}
console.log('[R1648] photographer invoice above desktop header and stable print tabs');