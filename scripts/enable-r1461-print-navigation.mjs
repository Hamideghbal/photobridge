import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(navFile,'utf8');
const once=(a,b)=>{if(nav.split(a).length!==2)throw Error('R1461 anchor '+a.slice(0,100));nav=nav.replace(a,b)};
if(!nav.includes('/* PB1461 refresh route */')){
 once("  const row=chrome.querySelector('.pb1126Secondary'),doc=currentDocument();", "  const row=chrome.querySelector('.pb1126Secondary'),doc=currentDocument();\n  document.documentElement.classList.toggle('pb1461ParentThird',active==='print'&&!!doc?.querySelector('.pb1461Orders,.simplePrintPilotWorkspaceMode'));\n");
 // R1762: CRM opens in its own frame; normalize the original Print frame's
 // inline else block so the legacy route restoration still applies to Print.
 // This must leave the CRM iframe URL and its isolated portal untouched.
 nav=nav.replace("else{const q=new URLSearchParams(key==='store'?","else{\n   const q=new URLSearchParams(key==='store'?");
 once("   const q=new URLSearchParams(key==='store'?", "   /* PB1461 refresh route */\n   const savedPrint=key==='print'?new URLSearchParams(location.search).get('pbPrintRoute'):null;\n   let restoredPrint=null;try{if(savedPrint?.startsWith('/')&&!savedPrint.startsWith('//')){const u=new URL(savedPrint,location.origin);if(u.origin===location.origin&&/^\\/photographer\\/(?:orders\\/(?:flow|needs_fix|ready|completed)|upload|album|archive|finance)\\/?$/.test(u.pathname)&&u.searchParams.get('pbLabChooser')!=='1'){u.searchParams.set('pbDesktopContent','1');u.searchParams.set('workspace','print');restoredPrint=u.pathname+u.search}}}catch{}\n   const q=new URLSearchParams(key==='store'?");
 once("frame.src=(key==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;", "frame.src=restoredPrint||(key==='store'?'/equipment-rental/book':'/photographer/orders/flow')+'?'+q;");
 // R1763: the older navigation stages can rebuild the original Print-only
 // handler before this installer runs. Reattach CRM to the same genuine tab
 // action instead of weakening the CRM regression test.
 const crmDispatch="if(key==='print'||key==='crm'){open(key);return;}";
 if(!nav.includes(crmDispatch)){
  const handler=' function navigate(key){';
  if(nav.split(handler).length!==2)throw Error('R1763 desktop navigate handler missing');
  nav=nav.replace(handler,handler+"\n  /* PB1763 CRM desktop navigation compatibility */\n  "+crmDispatch);
 }
 const crmHistory="['store','print','crm'].includes(panel)";
 if(!nav.includes(crmHistory)){
  const oldHistory="['store','print'].includes(panel)";
  if(!nav.includes(oldHistory))throw Error('R1763 desktop CRM history routing missing');
  nav=nav.replaceAll(oldHistory,crmHistory);
 }
 if(!nav.includes("if(key==='crm')frame.src='/customer-crm.html?portal=photographer&pbDesktopContent=1';else{"))
  throw Error('R1763 CRM iframe must remain isolated from Print routing');
 fs.writeFileSync(navFile,nav);
}
fs.copyFileSync('scripts/r1461-print-navigation.js','dist/web/photobridge-r1461-print-navigation.js');
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');if(!css.includes('/* PB1461 print navigation */')){css+='\n/* PB1461 print navigation */\n'+fs.readFileSync('scripts/r1461-print-navigation.css','utf8');fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.(?:css|js)\?[^"'\s]*)/g,url=>url.includes('printNavigation=r1461')?url:url+'&printNavigation=r1461');if(!html.includes('photobridge-r1461-print-navigation.js'))html=html.replace('</head>','<script defer src="/photobridge-r1461-print-navigation.js?v=r1461"></script></head>');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});execFileSync(process.execPath,['--check','dist/web/photobridge-r1461-print-navigation.js'],{stdio:'inherit'});console.log('[R1461] Unified print headers and explicit current-route restoration.');
