// R1887: In the Windows Lab client, embedded Customers/Calendar must remain
// below the existing Lab header (including the optional second navigation row).
// Do not change the public web version or finance/order routing.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root='dist/web/lab-desktop-ui';
const name='customer-crm-host.js';
const file=root+'/'+name;
const marker='/* PB1887 native Lab CRM header clearance */';
const replaceOnce=(source,from,to,label)=>{
 const count=source.split(from).length-1;
 if(count!==1)throw Error('[R1887] '+label+' expected once, got '+count);
 return source.replace(from,to);
};
let source=fs.readFileSync(file,'utf8');
if(!source.includes(marker)){
 // Preserve the existing responsive layout for mobile and Photographer.
 source=replaceOnce(source,
  "   '#root .labRoleWorkspace .labSingleHeader,'+",
  "   '#root .labRoleWorkspace .labSingleHeader,#root .labRoleWorkspace .pb1148SecondaryHeader,'+",
  'Lab primary and secondary header measurement');
 source=replaceOnce(source,
  "  const top=measuredTop||lastHeaderBottom;",
  [
   '  '+marker,
   "  const labDesktop=owner==='lab'&&matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)').matches;",
   "  const labNavBottom=labDesktop?Math.max(0,...[...document.querySelectorAll('#root .labRoleWorkspace .labSingleHeader,#root .labRoleWorkspace .pb1148SecondaryHeader')].filter(shown).map(el=>el.getBoundingClientRect().bottom)):0;",
   '  const top=labDesktop?Math.max(measuredTop||lastHeaderBottom,labNavBottom):measuredTop||lastHeaderBottom;',
   '  if(labDesktop&&top>0)lastHeaderBottom=top;'
  ].join('\n'),
  'native Lab header clearance');
 source=replaceOnce(source,
  '.pb1126MainNav,#root .labSingleHeader,',
  '.pb1126MainNav,.pb1148SecondaryHeader,#root .labSingleHeader,',
  'close embedded CRM when native Lab secondary tab selected');
 fs.writeFileSync(file,source);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});

const htmlFile=root+'/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
const re=/(customer-crm-host\.js\?[^"'<\s]+)/g;
let count=0;
html=html.replace(re,url=>{
 count++;
 return url.includes('nativeLabCrm=r1887')?url:url+'&nativeLabCrm=r1887';
});
if(count!==1)throw Error('[R1887] native CRM host reference expected once, got '+count);
fs.writeFileSync(htmlFile,html);

const manifestFile=root+'/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
if(manifest.protocol!==1||manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1887] Windows Lab manifest changed');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const asset of [name,'index.html']){
 const entry=manifest.files.find(x=>x.name===asset);
 if(!entry||entry.url!=='/lab-desktop-ui/'+asset)throw Error('[R1887] native asset missing: '+asset);
 entry.sha256=hash(fs.readFileSync(root+'/'+asset));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestFile,JSON.stringify(manifest));
console.log('[R1887] Windows Lab CRM preserves main and secondary navigation; manifest '+manifest.build.slice(0,12));
