import fs from 'node:fs';
import path from 'node:path';

// R1998: desktop Gallery is now a real embedded panel (R1997). Its old
// geometry only recognized a Gallery workspace in the parent document.
const galleryJs='dist/web/photobridge-r1310-layout.js';
let js=fs.readFileSync(galleryJs,'utf8');
if(!js.includes('/* PB1998 embedded gallery geometry */')){
 const anchor="  const gallery=!mobile()&&root.classList.contains('pb1126Desktop')&&active==='gallery'&&!!qs('.clientGalleryWorkspace')&&!qs('.clientGalleryManager');";
 if(js.split(anchor).length!==2)throw Error('[R1998] gallery geometry anchor missing/ambiguous');
 const next=[
  '  /* PB1998 embedded gallery geometry */',
  "  const embeddedGallery=!mobile()&&root.classList.contains('pb1126Embedded')&&",
  "   location.pathname==='/photographer/gallery'&&",
  "   new URLSearchParams(location.search).get('pbDesktopPanel')==='gallery';",
  "  const gallery=!mobile()&&!qs('.clientGalleryManager')&&(",
  "   embeddedGallery||(root.classList.contains('pb1126Desktop')&&active==='gallery'&&!!qs('.clientGalleryWorkspace'))",
  "  );"
 ].join('\n');
 js=js.replace(anchor,next);
 // Correct the class before React mounts so Gallery does not flash with Print
 // or Store's old 114px content offset on its first visible frame.
 const init=" const root=document.documentElement;";
 if(js.split(init).length!==2)throw Error('[R1998] embedded Gallery early-init anchor missing');
 js=js.replace(init,init+"\n if(root.classList.contains('pb1126Embedded')&&location.pathname==='/photographer/gallery'&&new URLSearchParams(location.search).get('pbDesktopPanel')==='gallery'&&matchMedia('(min-width:821px)').matches)root.classList.add('pb1310GalleryHome');");
 new Function(js);
 fs.writeFileSync(galleryJs,js);
}

const galleryCss='dist/web/photobridge-r1310-layout.css';
let css=fs.readFileSync(galleryCss,'utf8');
if(!css.includes('/* PB1998 gallery panel geometry */')){
 css += [
  '',
  '/* PB1998 gallery panel geometry */',
  '@media(min-width:821px){',
  ' /* Parent has only the 72px primary header on Gallery; no empty second row. */',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:has(>.pb1126MainNav>[data-pb1126-kind="gallery"].active){',
  '  height:72px!important;min-height:72px!important;max-height:72px!important;grid-template-rows:72px!important',
  ' }',
  ' html.pb1126Desktop body #pb1126ChromeHost #pb1126DesktopHeader:has(>.pb1126MainNav>[data-pb1126-kind="gallery"].active)>.pb1126Secondary{',
  '  display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important',
  ' }',
  ' html.pb1126Desktop body .pb1126ContentPanel[data-panel="gallery"]{top:72px!important}',
  ' /* The Gallery iframe starts at the panel edge; its own app header is hidden. */',
  ' html.pb1126Embedded.pb1310GalleryHome body #root main.photographerMain.pbFixedRoleHeader{',
  '  padding-top:0!important;margin-top:0!important;min-height:0!important',
  ' }',
  ' html.pb1126Embedded.pb1310GalleryHome body #root main.photographerMain>.photographerRolePageScrollArea{',
  '  position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;',
  '  width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;box-sizing:border-box!important;',
  '  margin:0!important;padding:0 16px 20px!important;scroll-padding-top:0!important;',
  '  overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:contain!important',
  ' }',
  ' html.pb1126Embedded.pb1310GalleryHome body #root .clientGalleryWorkspace{',
  '  width:100%!important;max-width:none!important;min-width:0!important;margin:0 auto!important;padding:0!important',
  ' }',
  ' /* Same blue-card measure as Print/Lab chooser: 792px wrapper minus 32px side padding. */',
  ' html.pb1126Embedded.pb1310GalleryHome body #root .clientGalleryWorkspace .clientGalleryIntro{',
  '  width:100%!important;max-width:760px!important;margin:0 auto 12px!important;box-sizing:border-box!important',
  ' }',
  ' html.pb1126Embedded.pb1310GalleryHome body #root .clientGalleryWorkspace .clientGalleryIntro.pb1159Intro{',
  '  height:112px!important;min-height:112px!important;padding:0!important',
  ' }',
  ' html.pb1126Embedded.pb1310GalleryHome body #root .clientGalleryWorkspace .clientGalleryIntro.pb1159Intro[open]{height:auto!important}',
  '}',
  ''
 ].join('\n');
 fs.writeFileSync(galleryCss,css);
}

// The category chips are authored inside the Store CHOOSER, not the store
// workspace. Hide only the embedded desktop chooser chips, keeping their
// underlying "all" default and all store cards intact.
const storeFile='dist/api/equipment-rental-book.html';
let store=fs.readFileSync(storeFile,'utf8');
if(!store.includes('id="pbR1998StoreChooserNoFilters"')){
 if(!store.includes('id="pbR1994StoreChooserFilterFlow"')||!store.includes('function ensureStoreChooserFiltersR1231(root)'))throw Error('[R1998] Store chooser source missing');
 const hide=[
  '<style id="pbR1998StoreChooserNoFilters">',
  '@media(min-width:821px){',
  ' html.pb1126Embedded body.pbR96ChoosingStore #storePhotographerWorkspace #storeChooserFiltersR1231,',
  ' html.pb1126Embedded body.pbR96ChoosingStore #storePhotographerWorkspace #storeChooserPanelR96 .pbR96StoreFilters{',
  '  display:none!important;visibility:hidden!important;position:static!important;',
  '  width:0!important;height:0!important;min-height:0!important;max-height:0!important;',
  '  margin:0!important;padding:0!important;border:0!important;gap:0!important;pointer-events:none!important',
  ' }',
  '}',
  '</style>'
 ].join('\n');
 if(store.split('</head>').length!==2)throw Error('[R1998] Store HTML head missing/ambiguous');
 store=store.replace('</head>',hide+'\n</head>');
 fs.writeFileSync(storeFile,store);
}

// Update web/API URLs independently; print, gallery and Store pages may each
// have an immutable query pinned by an earlier writer.
function updateHtml(dir){
 if(!fs.existsSync(dir))return;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()){updateHtml(p);continue;}
  if(!e.name.endsWith('.html'))continue;
  const src=fs.readFileSync(p,'utf8');
  const dst=src.replace(/(photobridge-r1310-layout\.(?:js|css))([^"'<> \t\r\n]*)/g,(_,name,q)=>{
   const clean=q.replace(/([?&])galleryPanel=[^&]*/g,'$1').replace(/[?&]$/,'');
   return name+clean+(clean.includes('?')?'&':'?')+'galleryPanel=r1998';
  });
  if(dst!==src)fs.writeFileSync(p,dst);
 }
}
updateHtml('dist/web');
updateHtml('dist/api');
console.log('[R1998] Gallery 72px parent/0px embedded viewport, shared 760px blue card, Store chooser filters hidden on desktop.');
