import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'dist/web');
const out=path.join(web,'lab-desktop-ui');
fs.rmSync(out,{recursive:true,force:true});
const files=[];
const allowed=/\.(html|js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|json)$/i;
function add(src,name){const bytes=fs.readFileSync(src);if(bytes.length>20e6)return;const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);files.push({name,url:'/lab-desktop-ui/'+name,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
function walk(dir,rel=''){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
    if(['desktop-ui','lab-desktop-ui','downloads'].includes(ent.name))continue;
    const name=path.posix.join(rel,ent.name),src=path.join(dir,ent.name);
    if(ent.isDirectory())walk(src,name);else if(ent.isFile()&&allowed.test(name))add(src,name);
  }
}
walk(web);
add(path.join(root,'apps/lab-desktop/desktop-overlay.js'),'desktop-overlay.js');
if(!files.some(f=>f.name==='index.html'))throw new Error('lab desktop UI index missing');
files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
const build=crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({protocol:1,channel:'lab',build,generatedAt:new Date().toISOString(),files}));
console.log('Lab UI release prepared:',files.length,'files',build.slice(0,12));
