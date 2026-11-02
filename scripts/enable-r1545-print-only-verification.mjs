import fs from 'node:fs';
import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bundle='assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync('dist/web/'+bundle,'utf8');
if(!js.includes('/* PB1545 local file verification only at print */')){
 const one=(a,b)=>{if(js.split(a).length!==2)throw Error('R1545 UI anchor changed: '+a.slice(0,100));js=js.replace(a,b)};
 one('gn=async le=>{if(!E){C(le.id);try{if(!await pb1450AllowStage(le))return;await It(le,"completed")','gn=async le=>{if(!E){C(le.id);try{await It(le,"completed")');
 one('un=async le=>{var Jt;if(!await pb1450AllowStage(le)){B(value=>value+1);return}const nt=', 'un=async le=>{var Jt;const nt=');
 one('if(["printing","binding","ready","completed"].includes(nt)&&!await pb1450AllowStage(le))','if(nt==="printing"&&!await pb1450AllowStage(le))');
 js+='\n/* PB1545 local file verification only at print */\n';fs.writeFileSync('dist/web/'+bundle,js);
}
// Site and installed Windows get the same verified stage handlers.
const root='dist/web/lab-desktop-ui',native=js.replace('const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"','const ai=()=>typeof window.showDirectoryPicker=="function"');if(!native.includes('const ai=()=>typeof window.showDirectoryPicker=="function"'))throw Error('R1545 native storage capability changed');fs.writeFileSync(root+'/'+bundle,native);
for(const directory of ['dist/web',root]){let html=fs.readFileSync(directory+'/index.html','utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&printVerify=r1545')?u:u+'&printVerify=r1545');fs.writeFileSync(directory+'/index.html',html)}
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1545 native contract changed');for(const name of [bundle,'index.html']){const entry=manifest.files.find(f=>f.name===name);if(!entry)throw Error('R1545 missing native asset');entry.sha256=hash(fs.readFileSync(root+'/'+name))}manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));
console.log('[PhotoBridge R1545] print-only local verification for site and installed native');
