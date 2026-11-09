// R1723: validate exact uppercase disk folder names in both delivered web and native Lab UIs.
// After all prior patch stages. Historic disk folders and saved per-order handles remain untouched.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const asset='assets/index-UIRefine-v655-r84.js';
for(const dir of ['dist/web','dist/web/lab-desktop-ui']){
  const jsFile=dir+'/'+asset, htmlFile=dir+'/index.html';
  let js=fs.readFileSync(jsFile,'utf8');
  const section=js.slice(js.lastIndexOf('function pb1664StorageBucket(order){'),js.lastIndexOf('async function pb1550Probe(root,detail){'));
  if(!section||!section.includes("?'MOSHTARI':'HAMKAR'")||!section.includes("function pb1664PreviousStorageBuckets(order)"))
    throw Error('[R1723] final '+dir+' storage labels or legacy fallback not installed; refusing stale delivery');
  if(!js.includes('for(const name of [pb1664StorageBucket(detail.order),day,saved.customer,Uy(detail,file)])'))
    throw Error('[R1723] '+dir+' new download path does not use uppercase storage bucket');
  execFileSync(process.execPath,['--check',jsFile],{stdio:'inherit'});
  let html=fs.readFileSync(htmlFile,'utf8');
  const jsPattern=/index-UIRefine-v655-r84\.js\?[^"'\s]+/g;
  const hits=[...html.matchAll(jsPattern)];
  if(hits.length!==1)throw Error('[R1723] '+dir+' main JS asset reference count '+hits.length);
  html=html.replace(jsPattern,value=>value.includes('storageFolders=r1723')?value:value+'&storageFolders=r1723');
  fs.writeFileSync(htmlFile,html);
  if(dir.endsWith('lab-desktop-ui')){
    const manifestFile=dir+'/manifest.json',m=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
    const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
    for(const name of [asset,'index.html']){
      const row=m.files.find(item=>item.name===name);
      if(!row)throw Error('[R1723] missing Windows manifest record '+name);
      row.sha256=hash(fs.readFileSync(dir+'/'+name));
    }
    m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
    fs.writeFileSync(manifestFile,JSON.stringify(m));
  }
}
console.log('[R1723] Both delivered Lab UI snapshots use exact HAMKAR / MOSHTARI for new orders; native manifest versioned, old folders preserved.');
