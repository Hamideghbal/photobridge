// R1770: restore the mandatory local disk check at the final print-stage entry.
// Run AFTER historical UI overwrites and AFTER R1769's order-first folder layout.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const marker='/* PB1770 FINAL PRINT STAGE GUARD */';
const asset='assets/index-UIRefine-v655-r84.js';
const start='It=async(le,nt,xt)=>{';
const next=',gn=async le=>';
const guard='if(nt==="printing"&&!await pb1450AllowStage(le)){B(value=>value+1);return{blocked:true}}';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/'+asset,htmlPath=root+'/index.html';
 let ui=fs.readFileSync(path,'utf8');
 if(ui.includes(marker))throw Error('[R1770] final print guard applied twice '+root);
 const a=ui.indexOf(start),b=ui.indexOf(next,a+start.length);
 if(a<0||b<=a||b-a>1600)throw Error('[R1770] print stage handler missing '+root);
 const handler=ui.slice(a,b);
 const index=handler.indexOf('pb1450AllowStage(');
 const patch=handler.indexOf('method:"PATCH"');
 if(patch<0)throw Error('[R1770] print PATCH missing '+root);
 if(index<0)ui=ui.slice(0,a)+start+guard+ui.slice(a+start.length);
 else if(index>patch)throw Error('[R1770] print-stage guard runs after PATCH '+root);
 const verify=ui.slice(ui.indexOf(start),ui.indexOf(next,ui.indexOf(start)));
 if(!verify.startsWith(start+guard))throw Error('[R1770] print stage not protected on entry '+root);
 ui+='\n'+marker+'\n';
 fs.writeFileSync(path,ui);
 execFileSync(process.execPath,['--check',path],{stdio:'inherit'});

 let html=fs.readFileSync(htmlPath,'utf8');
 const url=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
 if([...html.matchAll(url)].length!==1)throw Error('[R1770] single asset URL missing '+root);
 html=html.replace(url,u=>u.replace(/&printGuard=r\d+/g,'')+'&printGuard=r1770');
 fs.writeFileSync(htmlPath,html);

 const manifestPath=root+'/manifest.json';
 if(fs.existsSync(manifestPath)){
  const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  for(const name of [asset,'index.html']){
   const row=m.files?.find(x=>x.name===name);
   if(!row)throw Error('[R1770] Windows manifest entry missing '+name);
   row.sha256=sha(fs.readFileSync(root+'/'+name));
  }
  m.build=sha(Buffer.from(JSON.stringify(m.files)));
  m.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestPath,JSON.stringify(m));
 }
 console.log('[R1770] final print-stage verification before PATCH: '+root);
}
