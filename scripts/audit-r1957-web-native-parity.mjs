// R1957: read-only inventory of site/native UI divergence after every release patch.
// Never mutate native assets here; desktop-only patches must be preserved.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const web='dist/web', native=web+'/lab-desktop-ui';
const valid=/\.(html|js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|json)$/i;
const excluded=new Set(['desktop-ui','lab-desktop-ui','downloads']);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(dir,rel='',out=new Map()){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(excluded.has(e.name))continue;
  const name=path.posix.join(rel,e.name),file=path.join(dir,e.name);
  if(e.isDirectory())walk(file,name,out);
  else if(e.isFile()&&valid.test(name)&&fs.statSync(file).size<=20e6)out.set(name,sha(fs.readFileSync(file)));
 }
 return out;
}
const site=walk(web),client=walk(native),missing=[],stale=[],nativeOnly=[];
for(const [name,hash]of site){if(!client.has(name))missing.push(name);else if(client.get(name)!==hash)stale.push(name)}
for(const name of client.keys())if(!site.has(name)&&name!=='desktop-overlay.js'&&name!=='manifest.json')nativeOnly.push(name);
console.log('[R1957 AUDIT] '+JSON.stringify({site:site.size,native:client.size,missing:missing.length,stale:stale.length,nativeOnly:nativeOnly.length}));
for(const [kind,items] of [['MISSING',missing],['DIFF',stale],['NATIVE_ONLY',nativeOnly]])for(const p of items.slice(0,150))console.log('[R1957 '+kind+'] '+p);
if(missing.length>150||stale.length>150||nativeOnly.length>150)console.log('[R1957 AUDIT] output truncated');
