import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {patchPortal,patchReturn} from './r2089-mobile-equipment-camera-patch.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const helper=read('scripts/r2089-mobile-equipment-camera.js.txt'),css=read('scripts/r2089-mobile-equipment-camera.css.txt');
function write(file,content){
 fs.writeFileSync(file,content);const bytes=fs.readFileSync(file);
 for(const [ext,enc,dec] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]]){
  if(fs.existsSync(file+ext)){fs.writeFileSync(file+ext,enc(bytes));if(!dec(fs.readFileSync(file+ext)).equals(bytes))throw Error('R2089 stale '+file+ext)}
 }
}
const portal='dist/api/equipment-rental-portal.html',ret='dist/web/photobridge-r100f73-staff-desktop-return.js';
const html=patchPortal(read(portal),helper,css),js=patchReturn(read(ret));
new Function(helper);new Function(js);
const start=html.indexOf('<script id="pbR85AssetScanRuntime">')+'<script id="pbR85AssetScanRuntime">'.length;
new Function(html.slice(start,html.indexOf('</script>',start)));
write(portal,html);write(ret,js);
execFileSync(process.execPath,['--check',ret],{stdio:'inherit'});
console.log('[R2089] mobile-only pickup + return camera, compact preview, no changes to frozen Windows Store or Lab assets');
