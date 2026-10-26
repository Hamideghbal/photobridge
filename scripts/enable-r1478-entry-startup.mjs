import fs from 'node:fs';
// Readiness depends on the current workspace, not a removed legacy lab label.
for(const p of ['dist/web/photobridge-v904r100f37-store-header-core.js','dist/web/photobridge-v904r100f40-mobile-polish.js']){
 let s=fs.readFileSync(p,'utf8');if(!s.includes('/* PB1478 entry readiness */')){const a="||chooserVisible()||labName()==='لابراتوار')return;";if(s.split(a).length!==2)throw Error('R1478 readiness anchor '+p);s=s.replace(a,"||chooserVisible()||!w.querySelector('.photographerPrintModeNav'))return;");s+='\n/* PB1478 entry readiness */\n';fs.writeFileSync(p,s);}
}
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let s=fs.readFileSync(p,'utf8');
 if(!s.includes('id="pb1478StartupSpacing"'))s=s.replace('</head>',`<style id="pb1478StartupSpacing">#pbR1361MobileSplash{gap:24px!important}#pbR1361MobileSplash img{width:min(88vw,400px)!important;position:static!important;margin:0!important;transform:none!important}#pbR1361MobileSplash span{position:static!important;margin:0!important;transform:none!important;line-height:1.2!important;flex:0 0 auto}</style></head>`);
 s=s.replace(/(photobridge-v904r100f(?:37-store-header-core|40-mobile-polish)\.js\?[^"'\s]*)/g,u=>u.includes('entryReady=r1478')?u:u+'&entryReady=r1478');fs.writeFileSync(p,s);
}
