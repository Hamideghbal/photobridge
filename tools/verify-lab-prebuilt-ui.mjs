/** Validate the checked-in web assets used by the native Windows installer.
 * Production Liara site rebuild and native Electron packaging are independent:
 * replaying 100+ historical web migrations over an already-built dist/ tree
 * is not safe or required to ship the Windows app.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

export function verifyLabPrebuiltUi(dir=root){
 const web=path.join(dir,'dist/web');
 const files=[
  ['index.html',128],
  ['assets/index-UIRefine-v655-r84.js',10000],
  ['photobridge-r1137-lab-local-intake.js',1000],
  ['photobridge-r1147-lab-admin-header.js',1000],
  ['photobridge-r1163-desktop-gallery-header.js',1000],
  ['photobridge-r1326-print-details.css',200],
  ['photobridge-icon-512-v785.png',256],
 ];
 for(const [file,minBytes] of files){
   const absolute=path.join(web,file);
   if(!fs.existsSync(absolute)||!fs.statSync(absolute).isFile()||fs.statSync(absolute).size<minBytes)
     throw Error('[Lab prebuilt UI] Missing or invalid required website asset: '+file);
 }
 const html=fs.readFileSync(path.join(web,'index.html'),'utf8');
 if(!/<div id="root"><\/div>/.test(html))throw Error('[Lab prebuilt UI] React root is missing');
 if(!/src="\/assets\/index-UIRefine-v655-r84\.js\?[^"]+"/.test(html))throw Error('[Lab prebuilt UI] React bundle reference is missing');
 for(const basename of ['photobridge-r1137-lab-local-intake.js','photobridge-r1147-lab-admin-header.js']){
   if(!html.includes(basename+'?v='))throw Error('[Lab prebuilt UI] Versioned Lab JS missing: '+basename);
 }
 const bundle=fs.readFileSync(path.join(web,'assets/index-UIRefine-v655-r84.js'),'utf8');
 if(!bundle.includes('lab')||!bundle.includes('photographer'))
   throw Error('[Lab prebuilt UI] Expected compiled Lab/Photographer frontend is absent');
 return {count:files.length,source:'versioned checked-in web dist',note:'Installer UI is upgraded from verified server manifest at startup'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const v=verifyLabPrebuiltUi();console.log('[PhotoBridge Lab] Prebuilt UI verified:',JSON.stringify(v));
}
