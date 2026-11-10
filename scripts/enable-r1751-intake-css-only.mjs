// R1751: the previously approved account-row styling, installed without rewriting JS.
import fs from 'node:fs';
import crypto from 'node:crypto';
const name='photobridge-r1137-lab-local-intake.css';
const marker='/* R1751: responsive layout only; no intake launcher, order, or SMS changes. */';
const rules=fs.readFileSync('scripts/r1751-responsive-intake-account.css','utf8');
if(!rules.startsWith(marker)||!rules.includes('.pb1365CustomerAccountRow')||!rules.includes('@media(max-width:620px)'))throw Error('[R1751] stylesheet missing approved responsive rules');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const originalJS=fs.readFileSync(root+'/photobridge-r1137-lab-local-intake.js','utf8');
  if(!originalJS.includes("button.id='pb1137LocalIntakeButton'")||!originalJS.includes('pb1365CustomerAccountRow'))throw Error('[R1751] missing original launcher/account layout in '+root);
  if(root.endsWith('lab-desktop-ui')&&!originalJS.includes('/* PB1749 native visible intake */'))throw Error('[R1751] native launcher protection missing');
  const cssFile=root+'/'+name,previousCss=fs.readFileSync(cssFile,'utf8');
  if(!previousCss.includes(marker))fs.writeFileSync(cssFile,previousCss.trimEnd()+'\n\n'+rules);
  const htmlPath=root+'/index.html',oldHtml=fs.readFileSync(htmlPath,'utf8');
  const re=/photobridge-r1137-lab-local-intake\.css\?[^"'<>\s]+/g;
  if([...oldHtml.matchAll(re)].length!==1)throw Error('[R1751] CSS link count not 1: '+root);
  const newHtml=oldHtml.replace(re,url=>url.includes('layout=r1751')?url:url+'&layout=r1751');
  if(oldHtml!==newHtml)fs.writeFileSync(htmlPath,newHtml);
  const jsLink=/photobridge-r1137-lab-local-intake\.js\?[^"'<>\s]+/g;
  if(JSON.stringify([...oldHtml.matchAll(jsLink)].map(x=>x[0]))!==JSON.stringify([...newHtml.matchAll(jsLink)].map(x=>x[0])))throw Error('[R1751] launcher JS cache key changed');
  if(sha(fs.readFileSync(root+'/photobridge-r1137-lab-local-intake.js'))!==sha(originalJS))throw Error('[R1751] original launcher JS modified');
  if(root.endsWith('lab-desktop-ui')){
    const manifestFile=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
    if(manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1751] unknown Lab manifest format');
    for(const asset of [name,'index.html']){
      const entry=manifest.files.find(f=>f.name===asset);
      if(!entry)throw Error('[R1751] missing native asset '+asset);
      entry.sha256=sha(fs.readFileSync(root+'/'+asset));
    }
    manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));
    manifest.generatedAt=new Date().toISOString();
    fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  }
}
console.log('[R1751] Responsive account display restored with CSS only; Windows launcher and SMS unchanged.');
