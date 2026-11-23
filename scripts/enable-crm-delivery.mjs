// Run after legacy navigation writers, before desktop packaging and compression.
import fs from 'node:fs';
const revision='r1867-crm-delivery';
const replace=(text,before,after,label)=>{if(text.includes(after))return text;if(!text.includes(before))throw Error('CRM delivery anchor missing: '+label);return text.replace(before,after)};
const shared='dist/web/photobridge-r1761-crm-nav.js';
let nav=fs.readFileSync(shared,'utf8');
nav=replace(nav,'if(!portal){clearButtons();return;}','if(!portal){clearButtons();window.pbCrmClose?.();return;}','logout cleanup');
// R1877: the new navigation settles the final dock before revealing it.
if(nav.includes('if(enabled!==true){clearButtons();settleDock();return;}')){
 nav=nav.replace('if(enabled!==true){clearButtons();settleDock();return;}',
   'if(enabled===false)window.pbCrmClose?.();\n    if(enabled!==true){clearButtons();settleDock();return;}');
}else nav=replace(nav,'if(enabled!==true){clearButtons();return;}','if(enabled===false)window.pbCrmClose?.();\n    if(enabled!==true){clearButtons();return;}','disabled tab cleanup');
nav=replace(nav,"window.addEventListener('focus',refresh);","window.addEventListener('focus',()=>{if(document.documentElement?.classList?.contains('pbCrmTabOpen')||document.documentElement?.classList?.contains('pbCrmDesktopActive'))schedule();else refresh();});",'stable tab focus');
fs.writeFileSync(shared,nav);
const desktop='dist/web/photobridge-r1126-desktop-navigation.js';
nav=fs.readFileSync(desktop,'utf8');
nav=replace(nav,"['crm','مشتریان','/customer-crm.html?portal=photographer']", "['crm','مشتریان','/customer-crm.html?portal=photographer&crmRev="+revision+"']",'desktop href');
// R1976: the desktop CRM/Calendar frame now selects the current pane in one
// shared safe URL helper. Leave the modern source intact; only patch old layouts.
if(!nav.includes("if(key==='crm'||key==='calendar')frame.src=window.pbCrmFrameUrl?"))
 nav=replace(nav,"if(key==='crm')frame.src='/customer-crm.html?portal=photographer&pbDesktopContent=1';else{", "if(key==='crm')frame.src=window.pbCrmFrameUrl?window.pbCrmFrameUrl('photographer'):'/customer-crm.html?portal=photographer&pbDesktopContent=1&crmRev="+revision+"';else{",'desktop iframe');
nav=replace(nav,"if(u.href==='about:blank')return;if(u.origin", "if(u.href==='about:blank')return;if(key==='crm'&&u.pathname!=='/customer-crm.html'){location.assign(u.href);return;}if(u.origin",'prevent recursive portal');
nav=replace(nav,"  for(const [key,label,href] of tabs){", "  document.documentElement.classList.toggle('pbCrmDesktopActive',active==='crm');\n  for(const [key,label,href] of tabs){",'single header');
fs.writeFileSync(desktop,nav);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8');
 for(const name of ['photobridge-r1761-crm-nav.js','photobridge-r1761-crm-nav.css','photobridge-r1126-desktop-navigation.js']){
  const escaped=name.split('.').join('[.]');
  html=html.replace(new RegExp('/'+escaped+'[?][^"\\s>]+','g'),url=>{const query=new URLSearchParams(url.slice(url.indexOf('?')+1));query.set('v',revision);return '/'+name+'?'+query;});
 }
 if(!html.includes('/photobridge-r1761-crm-nav.js?'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1761-crm-nav.css?v='+revision+'"><script src="/photobridge-r1761-crm-nav.js?v='+revision+'" defer></script></head>');
 if(!html.includes('/customer-crm-host.js?'))html=html.replace('</head>','<link rel="stylesheet" href="/customer-crm-host.css?v='+revision+'"><script src="/customer-crm-host.js?v='+revision+'" defer></script></head>');
 // R1875: the checked-in HTML may already include these assets with only a
 // deploy-revision query. Normalize both version keys before the deploy-rev
 // final pass, so the existing CRM contract and cache busting both survive.
 for(const name of ['customer-crm-host.js','customer-crm-host.css']){
  const escaped=name.split('.').join('[.]');
  html=html.replace(new RegExp('/'+escaped+'(?:[?][^"\\s>]+)?','g'),'/'+name+'?v='+revision);
 }
 fs.writeFileSync(file,html);
}
// CRM script names are stable; every deploy must also change their cache keys.
const deployRevision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/web/customer-crm.html']){
 let html=fs.readFileSync(file,'utf8');
 const names=['photobridge-r1761-crm-nav.js','photobridge-r1761-crm-nav.css','photobridge-r1126-desktop-navigation.js','customer-crm-host.js','customer-crm-host.css','customer-crm-ui.js','customer-calendar.js','customer-calendar.css','photobridge-r1766-crm-unified.css','photobridge-r1106-mobile-store-panel.js','photobridge-r1099-photographer-tabs.js'];
 for(const name of names){const escaped=name.split('.').join('[.]');html=html.replace(new RegExp('/'+escaped+'[?][^"\\s>]+','g'),url=>{const q=new URLSearchParams(url.slice(url.indexOf('?')+1));q.set('rev',deployRevision);return '/'+name+'?'+q;});}
 fs.writeFileSync(file,html);
}
// CRM is a live document, never a year-long immutable asset.
let server=fs.readFileSync('dist/api/server.js','utf8');
const signature='function serveWeb(req, res, pathname) {';
const documentRoute=`${signature}
    /* CRM_DOCUMENT_NO_STORE */
    if(pathname==='/customer-crm.html'){
        const file=path.join(WEB_DIR,'customer-crm.html');
        if(!fs.existsSync(file))return sendText(res,503,'Customer page is not available.');
        const html=fs.readFileSync(file,'utf8');
        res.writeHead(200,{'content-type':'text/html; charset=utf-8','content-length':Buffer.byteLength(html),'cache-control':'no-store, max-age=0, must-revalidate','pragma':'no-cache','expires':'0','x-photobridge-deploy-revision':DEPLOY_REVISION});
        res.end(req.method==='HEAD'?undefined:html);return;
    }`;
server=replace(server,signature,documentRoute,'uncached CRM document');
fs.writeFileSync('dist/api/server.js',server);
console.log('[CRM delivery] portal tabs share one shell; cached old HTML bypassed; navigation revision '+revision);
