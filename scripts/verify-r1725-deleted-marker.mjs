// R1725: validate the compiled browser/Windows Lab UI can re-pair a folder whose
// .photobridge-folder-id.json was deleted, while preserving historical downloads.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const asset='assets/index-UIRefine-v655-r84.js';
const tag='storageMarker=r1725';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const jsPath=root+'/'+asset,htmlPath=root+'/index.html';
  const source=fs.readFileSync(jsPath,'utf8');
  if(!source.includes('function pb1395MissingMarker(err){')
   ||!source.includes("if(!create||!pb1395MissingMarker(err))throw err")
   ||!source.includes("read:async()=>{const current=await qs().catch(err=>{if(pb1395MissingMarker(err))return null;throw err})"))
    throw Error('[R1725] '+root+' still has old missing-marker behavior; refusing stale UI');
  execFileSync(process.execPath,['--check',jsPath],{stdio:'inherit'});
  let html=fs.readFileSync(htmlPath,'utf8');
  const matcher=/index-UIRefine-v655-r84\.js\?[^"'\s]+/g;
  const matches=[...html.matchAll(matcher)];
  if(matches.length!==1)throw Error('[R1725] '+root+' main bundle link count '+matches.length);
  html=html.replace(matcher,raw=>raw.includes(tag)?raw:raw+'&'+tag);
  fs.writeFileSync(htmlPath,html);
  if(root.endsWith('lab-desktop-ui')){
    const manifestFile=root+'/manifest.json';
    const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
    const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
    for(const name of [asset,'index.html']){
      const row=manifest.files.find(x=>x.name===name);
      if(!row)throw Error('[R1725] missing Lab Windows UI record '+name);
      row.sha256=hash(fs.readFileSync(root+'/'+name));
    }
    manifest.build=hash(JSON.stringify(manifest.files));
    manifest.generatedAt=new Date().toISOString();
    fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  }
}
console.log('[R1725] Deleted folder marker recovery enabled and cache/Windows manifest updated; pinned historical orders unchanged.');
