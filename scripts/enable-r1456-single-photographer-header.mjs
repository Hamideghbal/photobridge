import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const file='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(file,'utf8');
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1456 anchor '+a.slice(0,110));return s.replace(a,b)};
if(!nav.includes('/* PB1456 persistent embedded ownership */')){
 nav=once(nav," if(query.get('pbDesktopContent')==='1'){",` /* PB1456 persistent embedded ownership */
 const pb1456ManagedContent=(()=>{try{const frame=window.frameElement,panel=frame?.closest('.pb1126ContentPanel');return window.parent!==window&&panel?.ownerDocument.defaultView===window.parent&&['print','store'].includes(panel.dataset.panel)}catch{return false}})();
 if(query.get('pbDesktopContent')==='1'||pb1456ManagedContent){`);
 nav=once(nav," if(document.body?.classList.contains('pbAuthenticatedPhotographerPortal'))", " // Only one owner may register header, panel and navigation listeners in this document.\n if(window.pb1456DesktopNavigationStarted)return;window.pb1456DesktopNavigationStarted=true;\n if(document.body?.classList.contains('pbAuthenticatedPhotographerPortal'))");
 nav=once(nav,"loading.hidden=true;schedule();if(!panel.hidden)","frame.contentDocument.documentElement.classList.add('pb1126Embedded');loading.hidden=true;schedule();if(!panel.hidden)");
 fs.writeFileSync(file,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');if(!css.includes('/* PB1456 embedded chrome suppression */')){css+='\n/* PB1456 embedded chrome suppression */\nhtml.pb1126Embedded body>#pb1126ChromeHost{display:none!important;visibility:hidden!important;pointer-events:none!important}\n';fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.(?:js|css)\?[^"'\s]*)/g,url=>url.includes('headerOwner=r1456')?url:url+'&headerOwner=r1456');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check','dist/web/photobridge-r1126-desktop-navigation.js'],{stdio:'inherit'});console.log('[R1456] Managed iframe ownership survives navigation; one photographer header owner.');
