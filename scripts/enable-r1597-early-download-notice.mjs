import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const {patchEarlyNotice,marker}=require('./r1597-early-download-notice.cjs');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const bundle=root+'/assets/index-UIRefine-v655-r84.js';
  const source=fs.readFileSync(bundle,'utf8');
  if(source.includes('/* PB1593 confirmed lab stage flights'))throw Error('R1597 requires safe R1596 Lab rollback');
  const updated=patchEarlyNotice(source);
  if(!updated.includes(marker))throw Error('R1597 verified notice patch missing');
  if(updated!==source)fs.writeFileSync(bundle,updated);
  execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
  const htmlFile=root+'/index.html';
  let html=fs.readFileSync(htmlFile,'utf8');
  html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&noticeFast=r1597')?url:url+'&noticeFast=r1597');
  fs.writeFileSync(htmlFile,html);
}
const root='dist/web/lab-desktop-ui',file=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const digest=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
  const item=manifest.files.find(entry=>entry.name===name);
  if(!item)throw Error('R1597 Windows update manifest missing '+name);
  item.sha256=digest(fs.readFileSync(root+'/'+name));
}
manifest.build=digest(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(file,JSON.stringify(manifest));
console.log('[R1597] verified receipt notice shown before invoice awaits; Windows and web updated');