import crypto from 'node:crypto';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {softenCss} from './soften-blue-shadows.mjs';
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const revision='r1867-crm-delivery';
export async function verifyLiveCrm({inspect=false,base='https://photobridge.ir',expectedRevision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim()}={}){
 async function get(path){const response=await fetch(base+path,{signal:AbortSignal.timeout(20000),headers:{'cache-control':'no-cache'}});const text=await response.text();if(!response.ok)throw Error('CRM '+path+' returned '+response.status);return {text,type:response.headers.get('content-type')||'',cache:response.headers.get('cache-control')||'',revision:response.headers.get('x-photobridge-deploy-revision'),sha256:hash(text)}}
 const menus=['customer-crm-service-menus-r1868.js','customer-crm-service-menus-r1868.css'];
 for(const portal of ['photographer','lab']){
  const path='/customer-crm.html?portal='+portal+'&pbDesktopContent=1&crmRev='+revision;
  const page=await get(path);
  console.log('CRM delivery '+JSON.stringify({portal,cache:page.cache,revision:page.revision,sha256:page.sha256,calendar:page.text.includes('id="cal-days"'),consent:page.text.includes('id="marketing-consent"'),back:page.text.includes('id="back"')}));
  if(!inspect){
   if(!page.type.includes('text/html')||!page.cache.includes('no-store')||page.cache.includes('immutable')||page.revision!==expectedRevision)throw Error('CRM HTML delivery/cache/revision mismatch for '+portal);
   if(!menus.every(name=>page.text.includes('/'+name+'?rev='+encodeURIComponent(expectedRevision))))throw Error('CRM service menu references missing for '+portal);
   if(!page.text.includes('id="cal-days"')||!page.text.includes('id="customer-details"')||page.text.includes('id="marketing-consent"')||page.text.includes('id="back"')||!page.text.includes('crmEmbedded'))throw Error('CRM page contains stale layout for '+portal);
  }
 }
 for(const name of ['customer-crm-ui.js','customer-calendar.js','customer-calendar.css','customer-crm-host.js','customer-crm-host.css',...menus]){
  const asset=await get('/'+name+'?'+(menus.includes(name)?'':'v='+revision+'&')+'rev='+encodeURIComponent(expectedRevision));
  const source=fs.readFileSync('dist/web/'+name,'utf8');
  const expected=hash(name==='customer-crm-service-menus-r1868.css'?softenCss(source):source);
  console.log('CRM asset '+JSON.stringify({name,sha256:asset.sha256,expected,exact:asset.sha256===expected}));
  if(!inspect&&(!/(javascript|css)/i.test(asset.type)||asset.sha256!==expected))throw Error('CRM asset differs from reviewed source: '+name);
 }
 if(!inspect){
  // R1955: Navigation scripts have independent, reviewed release query strings.
  // The old check incorrectly demanded CRM revision on all three and rejected
  // a healthy Liara deployment despite its exact shared asset hashes passing.
  const shippedHtml=fs.readFileSync('dist/web/index.html','utf8');
  const scriptRef=name=>{
   const start=shippedHtml.indexOf('/'+name+'?');
   if(start<0)throw Error('CRM referenced script absent from released HTML: '+name);
   let end=start;
   while(end<shippedHtml.length&&!/["'\\s<>]/.test(shippedHtml[end]))end++;
   return shippedHtml.slice(start,end);
  };
  const requiredNavRefs=['customer-crm-host.js','photobridge-r1761-crm-nav.js','photobridge-r1126-desktop-navigation.js'].map(scriptRef);
  for(const path of ['/photographer/gallery','/lab']){
   const page=await get(path);
   for(const script of requiredNavRefs)if(!page.text.includes(script))throw Error('CRM portal navigation differs from released HTML at '+path+': '+script);
  }
  console.log('CRM LIVE VERIFIED: '+expectedRevision+'; both portals, uncached HTML and exact reviewed CRM asset hashes.');
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await verifyLiveCrm({inspect:process.argv.includes('--inspect')});
