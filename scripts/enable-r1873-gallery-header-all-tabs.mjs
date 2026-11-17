// R1873: final delivery after the legacy header and CRM writers.
import fs from 'node:fs';
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
if(!revision.includes('r1875-mobile-header'))throw Error('[R1875] unexpected release revision');
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8');
 for(const name of ['photobridge-v904r100f41-header-date-name-fit.js','photobridge-v904r100f41-header-date-name-fit.css','customer-crm-host.js','customer-crm-host.css']){
  const escaped=name.replaceAll('.','[.]');
  const re=new RegExp('(["\\x27])(/'+escaped+')(?:[?][^"\\x27]*)?\\1','g');
  let count=0;
  html=html.replace(re,(whole,quote,pathname)=>{count++;return quote+pathname+'?rev='+encodeURIComponent(revision)+quote;});
  if(!count)throw Error('[R1873] entrypoint asset missing: '+name+' in '+file);
 }
 fs.writeFileSync(file,html);
}
console.log('[R1873] unified Gallery account header + CRM clearance, revision',revision);
