/**
 * R1360: Consistent PhotoBridge installed-app branding.
 * A single blue/white vector feeds the PWA launcher and native Lab installer.
 * Retain the OS-owned splash; do not add a second HTML splash overlay.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';

export async function buildBrand(root=process.cwd()) {
  const web=path.join(root,'dist','web');
  const artwork=path.join(web,'photobridge-app-blue-r1360.svg');
  const svg=fs.readFileSync(artwork,'utf8');
  if (!svg.includes('fill="#315efb"') || !svg.includes('PhotoBridge') || !svg.includes('#ffffff'))
    throw Error('R1360 requires the blue/white PhotoBridge source artwork');
  for(const [size,name] of [
    [192,'photobridge-native-192-r1360.png'],
    [512,'photobridge-native-512-r1360.png'],
    [180,'photobridge-native-touch-r1360.png']
  ]) {
    await sharp(Buffer.from(svg),{density:192}).resize(size,size).png({compressionLevel:9})
      .toFile(path.join(web,name));
  }
  const manifestFile=path.join(web,'photobridge.webmanifest');
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  manifest.background_color='#315efb';
  manifest.theme_color='#315efb';
  manifest.icons=[192,512].map(size=>({
    src:'/photobridge-native-'+size+'-r1360.png',sizes:size+'x'+size,
    type:'image/png',purpose:'any maskable'
  }));
  manifest._legacy_splash_icon='/photobridge-native-512-r1360.png';
  if(Array.isArray(manifest.related_applications))manifest.related_applications=manifest.related_applications.map(app=>({
    ...app,url:typeof app.url==='string'?app.url.replace(/([?&])v=r\d+/, '$1v=r1360'):app.url
  }));
  fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');

  for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']) {
    const target=path.join(root,file);
    if(!fs.existsSync(target))throw Error('R1360 missing dependent page: '+file);
    let html=fs.readFileSync(target,'utf8');
    html=html.replace(/photobridge\.webmanifest\?v=r\d+/g,'photobridge.webmanifest?v=r1360')
      .replace(/photobridge-native-touch-r\d+\.png/g,'photobridge-native-touch-r1360.png');
    if(file==='dist/web/index.html') {
      let changed=false;
      html=html.replace(/(<style id="pbR1284LaunchStyle">)([\s\S]*?)(<\/style>)/,(_,head,css,tail)=>{
        changed=true;
        return head+css.replaceAll('#040e1a','#315efb').replaceAll('#9fb5ce','#ffffff')+tail;
      });
      if(!changed)throw Error('R1360 expected original single-splash boot style');
      if(/<div id="pbAppSplashV780"/.test(html))throw Error('R1360 must not restore a duplicate HTML splash');
    }
    fs.writeFileSync(target,html);
  }
  console.log('[PhotoBridge R1360] Blue canvas, larger white bridge and compact plain PhotoBridge wordmark ready.');
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  await buildBrand();
