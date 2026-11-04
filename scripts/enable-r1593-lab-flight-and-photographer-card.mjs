import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const filename='assets/index-UIRefine-v655-r84.js';
const sites=['dist/web','dist/web/lab-desktop-ui'];
const cssName='photobridge-r1593-photographer-compact.css';
const labCssName='photobridge-r1593-lab-order-fly.css';
const labJsName='photobridge-r1593-lab-order-fly.js';

function patchBundle(js){
 if(js.includes('/* PB1593 lab queue flight */'))return js;
 const start=js.indexOf('function Uf('),end=js.indexOf('function vi(',start);
 if(start<0||end<=start)throw new Error('R1593 lab workflow boundaries missing');
 let chunk=js.slice(start,end);
 function replaceOne(hay,needle,replacement,name){
   const count=hay.split(needle).length-1;
   if(count!==1)throw new Error('R1593 expected one '+name+' anchor, found '+count);
   return hay.replace(needle,replacement);
 }

 // R1578 used to dispatch a whole-queue slide on an automatic change.
 // Keep this event ONLY on manual tab selection via Q(), not on stage completion.
 const transfer="Gt=async(le,nt)=>{window.dispatchEvent(new CustomEvent('photobridge-queue-transfer',{detail:{from:T,to:nt,number:V(le.number)}}));";
 if(chunk.includes(transfer))chunk=replaceOne(chunk,transfer,'Gt=async(le,nt)=>{','remove automatic whole-queue slide');
 chunk=replaceOne(chunk,
   'await ee(T,nt,()=>{k(nt),S(null),I(null),O(null),Dn(ur(nt,"",l))}),b(String(le.id))',
   'S(null),I(null),O(null),b(String(le.id))',
   'stop lab destination tab and URL switching');

 // PATCH acknowledgments: start a flight only AFTER the server confirms success
 // and BEFORE the queue refresh removes the previous card from React.
 const it=chunk.indexOf('It=async('),gn=chunk.indexOf(',gn=async le=>',it);
 if(it<0||gn<=it)throw new Error('R1593 lab It completion boundary missing');
 let itBody=chunk.slice(it,gn);
 itBody=replaceOne(itBody,'return await ye(),Mt',
   'return nt==="completed"&&window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"completed"}),await ye(),Mt',
   'print delivered confirmation before refresh');
 chunk=chunk.slice(0,it)+itBody+chunk.slice(gn);

 const un=chunk.indexOf('un=async le=>'),cn=chunk.indexOf(',Cn=async(le,nt)=>',un);
 if(un<0||cn<=un)throw new Error('R1593 print-ready handler boundary missing');
 let ready=chunk.slice(un,cn);
 const fast='k("ready");qt=!0;void ye().catch(()=>{});void Gt(le,"ready").catch(()=>{})';
 const legacy='await ye(),await Gt(le,"ready"),qt=!0';
 const flight='window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"ready"})';
 if(ready.includes(fast)){
   const count=ready.split(fast).length-1;
   if(count!==2)throw new Error('R1593 expected two R1547 fast-ready branches, got '+count);
   ready=ready.split(fast).join(flight+';qt=!0;void ye().catch(()=>{});void Gt(le,"ready").catch(()=>{})');
 }else{
   const count=ready.split(legacy).length-1;
   if(count!==2)throw new Error('R1593 expected two legacy print-ready branches, got '+count);
   ready=ready.split(legacy).join(flight+',await ye(),await Gt(le,"ready"),qt=!0');
 }
 chunk=chunk.slice(0,un)+ready+chunk.slice(cn);

 const album=chunk.indexOf('Cn=async(le,nt)=>'),actions=chunk.indexOf(',aa=async(le,nt)=>',album);
 if(album<0||actions<=album)throw new Error('R1593 album stage boundary missing');
 let albumBody=chunk.slice(album,actions);
 const fastAlbum='nt==="ready"&&(k("ready"),qt=!0,void ye().catch(()=>{}),void Gt(le,"ready").catch(()=>{}))';
 const legacyAlbum='nt==="ready"&&(await ye(),await Gt(le,"ready"),qt=!0)';
 if(albumBody.includes(fastAlbum)){
   albumBody=replaceOne(albumBody,fastAlbum,
     'nt==="ready"&&('+flight+',qt=!0,void ye().catch(()=>{}),void Gt(le,"ready").catch(()=>{}))',
     'R1547 album ready without auto tab switch');
 }else{
   albumBody=replaceOne(albumBody,legacyAlbum,
     'nt==="ready"&&('+flight+',await ye(),await Gt(le,"ready"),qt=!0)',
     'legacy album ready without auto tab switch');
 }
 albumBody=replaceOne(albumBody,
   'nt!=="ready"&&(await ye(),nt==="completed"?',
   'nt!=="ready"&&(nt==="completed"&&window.PB1593LabFlyOrder?.({orderId:String(le.id),target:"completed"}),await ye(),nt==="completed"?',
   'album delivery before refresh');
 chunk=chunk.slice(0,album)+albumBody+chunk.slice(actions);

 chunk=replaceOne(chunk,'children:"تب سفارش تغییر کرد"',
   'children:"سفارش به بخش جدید منتقل شد"','accurate lab destination toast');
 return js.slice(0,start)+chunk+js.slice(end)+'\n/* PB1593 lab queue flight */\n';
}

const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const root of sites){
 const jsPath=root+'/'+filename;
 if(!fs.existsSync(jsPath))throw new Error('R1593 missing UI bundle '+jsPath);
 const original=fs.readFileSync(jsPath,'utf8');
 const patched=patchBundle(original);
 if(patched!==original)fs.writeFileSync(jsPath,patched);
 execFileSync(process.execPath,['--check',jsPath],{stdio:'inherit'});
 for(const [source,destination] of [
   ['scripts/r1593-photographer-card-compact.css',cssName],
   ['scripts/r1593-lab-order-fly.css',labCssName],
   ['scripts/r1593-lab-order-fly.js',labJsName]
 ])fs.copyFileSync(source,root+'/'+destination);
 execFileSync(process.execPath,['--check',root+'/'+labJsName],{stdio:'inherit'});
 const htmlPath=root+'/index.html';
 let html=fs.readFileSync(htmlPath,'utf8');
 const resources=[
   '<link rel="stylesheet" href="/'+cssName+'?v=r1593">',
   '<link rel="stylesheet" href="/'+labCssName+'?v=r1593">',
   '<script defer src="/'+labJsName+'?v=r1593"></script>'
 ];
 if(!resources.every(v=>html.includes(v))){
   if(!html.includes('</head>'))throw new Error('R1593 missing HTML head in '+root);
   html=html.replace('</head>',resources.filter(v=>!html.includes(v)).join('\n')+'\n</head>');
   fs.writeFileSync(htmlPath,html);
 }
 // The Windows app downloads only manifest-listed, hash-verified files.
 if(root.endsWith('/lab-desktop-ui')){
   const manifestFile=root+'/manifest.json';
   const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
   if(manifest.protocol!==1||manifest.channel!=='lab')throw new Error('R1593 native UI manifest incompatible');
   for(const name of [filename,'index.html',cssName,labCssName,labJsName]){
     let entry=manifest.files.find(f=>f.name===name);
     if(!entry){entry={name,url:'/lab-desktop-ui/'+name};manifest.files.push(entry)}
     entry.sha256=sha(fs.readFileSync(root+'/'+name));
   }
   manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
   manifest.build=sha(JSON.stringify(manifest.files));
   manifest.generatedAt=new Date().toISOString();
   fs.writeFileSync(manifestFile,JSON.stringify(manifest));
   console.log('[R1593] Verified native Windows Lab UI manifest updated: '+manifest.build.slice(0,12));
 }
}
console.log('[R1593] Compacted desktop print cards; Lab ready/delivered card flight delivered to site AND Windows app.');
