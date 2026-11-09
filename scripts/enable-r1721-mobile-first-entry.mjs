// R1721: one-document first-entry routing on mobile; no Gallery flash or second launch.
// Run AFTER R1720 and AFTER Windows desktop snapshots in Liara Docker build.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
function one(source,anchor,replacement,label) {
  const count=source.split(anchor).length-1;
  if(count!==1)throw Error('[R1721] '+label+' anchor count '+count);
  return source.replace(anchor,replacement);
}
const entryPath='dist/web/photobridge-r100f5-entry-routing.js';
let entry=fs.readFileSync(entryPath,'utf8');
if(!entry.includes('/* PB1721 no-reload mobile entry */')){
  entry=one(entry,
    "if(q.has('pbEntryDone')||q.get('pbLabChooser')==='1'||q.get('workspace')==='print')return;",
    "if(q.has('pbEntryDone')||q.has('walletPayment')||q.has('logged_out')||q.get('pbLabChooser')==='1'||q.get('workspace')==='print')return;",
    'explicit route safety');
  entry=one(entry,"    busy=true;\n    try{","    busy=true;\n    let moving=false;\n    try{",'route transition state');
  entry=one(entry,
    '      done=true;location.replace(destination);',
    [
      '      /* PB1721 no-reload mobile entry */',
      '      done=true;',
      "      if(window===window.top&&window.matchMedia?.('(max-width:820px)')?.matches&&destination.startsWith('/photographer/')){",
      '        // SPA navigation avoids restarting the entire photographer app.',
      "        history.replaceState(history.state,'',destination);",
      "        window.dispatchEvent(new PopStateEvent('popstate'));",
      '        moving=true;',
      "        requestAnimationFrame(()=>requestAnimationFrame(()=>document.documentElement.classList.remove('pb1721MobileEntryPending')));",
      '      }else{',
      '        // Store uses its own document; never show a temporary Gallery.',
      '        moving=true;location.replace(destination);',
      '      }'
    ].join('\n'),
    'single-document mobile routing');
  entry=one(entry,
    '    }catch{}finally{busy=false}',
    "    }catch{}finally{busy=false;if(!moving)document.documentElement.classList.remove('pb1721MobileEntryPending')}",
    'failure and unauthenticated entry');
  entry=one(entry,
    "  addEventListener('pageshow',()=>setTimeout(route,80));",
    "  addEventListener('popstate',()=>setTimeout(route,0));\n  addEventListener('pageshow',()=>setTimeout(route,80));",
    'login continuation');
  fs.writeFileSync(entryPath,entry);
}
execFileSync(process.execPath,['--check',entryPath],{stdio:'inherit'});

const bundlePath='dist/web/assets/index-UIRefine-v655-r84.js';
let bundle=fs.readFileSync(bundlePath,'utf8');
if(!bundle.includes('pb1721MobileEntryPending')){
  const anchor='location.pathname==="/photographer"||location.pathname==="/photographer/login"||location.pathname==="/login"){const b=';
  const replacement='location.pathname==="/photographer"||location.pathname==="/photographer/login"||location.pathname==="/login"){'+
    'if(window===window.top&&window.matchMedia?.("(max-width:820px)")?.matches&&!be.has("logged_out")&&!be.has("walletPayment")&&!be.has("pbEntryDone")&&be.get("workspace")!=="print"&&be.get("pbLabChooser")!=="1"&&(location.pathname==="/photographer"||location.pathname==="/photographer/login")){'+
    'document.documentElement.classList.add("pb1721MobileEntryPending");'+
    'if(location.pathname==="/photographer/login")Dn("/photographer",!0)}else{const b=';
  bundle=one(bundle,anchor,replacement,'React auto Gallery/AI redirect');
  // Retain the React effect's popstate listener cleanup in both branches.
  const tick=String.fromCharCode(96),dollar=String.fromCharCode(36);
  const suffix='Dn('+tick+dollar+'{b}'+dollar+'{location.search}'+dollar+'{location.hash}'+tick+',!0)}return()=>window.removeEventListener("popstate",P)';
  bundle=one(bundle,suffix,suffix.replace('!0)}return','!0)}}return'),'React effect cleanup');
  fs.writeFileSync(bundlePath,bundle);
}
execFileSync(process.execPath,['--check',bundlePath],{stdio:'inherit'});

const htmlPath='dist/web/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
const prepaint="<script id=\"pb1721MobileFirstEntry\">try{const p=location.pathname.replace(/\\/+$/,'')||'/',q=new URLSearchParams(location.search);if(window===window.top&&window.matchMedia('(max-width:820px)').matches&&p==='/photographer'&&!q.has('logged_out')&&!q.has('walletPayment')&&!q.has('pbEntryDone')&&q.get('pbLabChooser')!=='1'&&q.get('workspace')!=='print'){document.documentElement.classList.add('pb1721MobileEntryPending');setTimeout(()=>document.documentElement.classList.remove('pb1721MobileEntryPending'),6500)}}catch{}</script><style id=\"pb1721MobileFirstEntryStyle\">@media(max-width:820px){html.pb1721MobileEntryPending body #root{visibility:hidden!important;pointer-events:none!important}html.pb1721MobileEntryPending body #pbR1361MobileSplash{display:block!important}}</style>";
if(!html.includes('id="pb1721MobileFirstEntry"'))html=one(html,'<head>','<head>\n'+prepaint+'\n','early mobile prepaint');
if(html.includes('photobridge-r100f5-entry-routing.js?v=r1720')){
  html=one(html,'photobridge-r100f5-entry-routing.js?v=r1720','photobridge-r100f5-entry-routing.js?v=r1721','mobile router cache bust');
}else if(!html.includes('photobridge-r100f5-entry-routing.js?v=r1721')){
  throw Error('[R1721] Mobile router script URL not found');
}
fs.writeFileSync(htmlPath,html);
console.log('[R1721] Mobile first entry opens destination in the same document, without an intermediate Gallery.');
