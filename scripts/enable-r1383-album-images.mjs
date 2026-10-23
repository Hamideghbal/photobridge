import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1383 changed anchor '+a.slice(0,110));return s.replace(a,b)};
const server='dist/api/server.js';let s=fs.readFileSync(server,'utf8');
if(!s.includes('/* PB1383 color images */')){
 s="import {sanitizeAlbumColorImages,applyAlbumColorImages} from './album-color-images.js';\n/* PB1383 color images */\n"+s;
 s=once(s,'try{normalizeSharedAlbumPrices(b)}','try{normalizeSharedAlbumPrices(b);if(b.colorImages!==undefined)b.colorImages=sanitizeAlbumColorImages(b.colorImages)}');
 s=once(s,'albumExtrasEnabled:b.extrasEnabled??albumBase.extrasEnabled??true','albumExtrasEnabled:b.extrasEnabled??albumBase.extrasEnabled??true,albumColorImages:b.colorImages??albumBase.colorImages??{}');
 const a=s.indexOf('async function albumCatalogForLab('),b=s.indexOf('\nasync function albumOrderSnapshot(',a);let catalog=s.slice(a,b);catalog=once(catalog,'return { enabled: Boolean(lq.rows[0]?.album_enabled)', 'return applyAlbumColorImages({ enabled: Boolean(lq.rows[0]?.album_enabled)');catalog=once(catalog,'packageCatalog: { models: packageModels } };','packageCatalog: { models: packageModels } },labPreferences.albumColorImages||{});');s=s.slice(0,a)+catalog+s.slice(b);fs.writeFileSync(server,s);
}
const main='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(main,'utf8');
if(!ui.includes('/* PB1383 customer image fallback */')){
 ui=once(ui,'onClick:()=>Fe(String($e.packageId)),children:[','onClick:()=>Fe(String($e.packageId)),children:[$e.imageData?e.jsx("img",{src:$e.imageData,alt:"",className:"pb1383PackageColorPhoto"}):aa?.imageData?e.jsx("img",{src:aa.imageData,alt:"",className:"pb1383PackageColorPhoto"}):null,');ui+='\n/* PB1383 customer image fallback */\n';fs.writeFileSync(main,ui);
}
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(photobridge-r1380-album-editor\.css\?v=)[^"']+/g,'$1r1383').replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&flatAlbum=[^&"']*/g,'')+'&flatAlbum=r1383');fs.writeFileSync(index,html);
