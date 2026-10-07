import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),web=path.join(root,'dist/web'),out=path.join(web,'desktop-ui');fs.rmSync(out,{recursive:true,force:true});const files=[];
function add(src,name){const bytes=fs.readFileSync(src);if(bytes.length>20e6)return;const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);files.push({name,url:'/desktop-ui/'+name,sha256:crypto.createHash('sha256').update(bytes).digest('hex')})}
function walk(dir,rel=''){for(const f of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))){if(f.name==='desktop-ui'||f.name==='lab-desktop-ui'||f.name==='downloads')continue;const name=path.posix.join(rel,f.name),src=path.join(dir,f.name);if(f.isDirectory())walk(src,name);else if(f.isFile()&&/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|json)$/i.test(name))add(src,name)}}
walk(web);
add(path.join(root,'dist/api/equipment-rental-portal.html'),'equipment-rental-portal.html');
// R97: desktop-only behavior is now part of the hot-update payload as well. After one R97+
// desktop install, future overlay fixes arrive with a normal site deploy and do not require a new installer.
add(path.join(root,'apps/store-desktop/desktop-overlay.js'),'desktop-overlay.js');
files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
const build=crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex');fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({protocol:1,channel:'store',build,generatedAt:new Date().toISOString(),files}));console.log('Store UI release prepared:',files.length,'files',build.slice(0,12));
