import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s),once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1576 anchor changed '+a.slice(0,80));return s.replace(a,b)};
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let s=read(file);
 if(!s.includes('/* R1576 immediate missing-price dialog */')){
  s=once(s,'async function pb1568AfterManualDownload(orderId){','async function pb1568AfterManualDownload(orderId,labId){');
  s=once(s,'pb1568AfterManualDownload(le.id)','pb1568AfterManualDownload(le.id,detail.order.lab_id||t.id)');
  s=once(s,"  if(code==='invoice_pricing_required'){", "  if(code==='invoice_pricing_required'){\n   pb1576QueuePrice(labId,orderId);");
  const hook='x.useEffect(()=>{const le=()=>{const nt=jf(l),xt=hy(l);';
  s=once(s,hook,`x.useEffect(()=>{const lab=t?.id;if(!lab)return;let active=true,opening=false;const show=()=>{if(!active||opening||Se)return;let ids;try{ids=JSON.parse(localStorage.getItem('pb1576-price:'+lab)||'[]')}catch{return}const id=Array.isArray(ids)&&ids[0];if(!id)return;opening=true;const open=order=>{if(!active||!order)return;localStorage.setItem('pb1576-price:'+lab,JSON.stringify(JSON.parse(localStorage.getItem('pb1576-price:'+lab)||'[]').filter(value=>value!==id)));on(order,"none")};const known=p.find(row=>String(row.id)===String(id));if(known)open(known);else Me('/api/lab/orders/'+encodeURIComponent(id)).then(data=>open(data.order)).catch(()=>{})};show();addEventListener('photobridge-price-required',show);return()=>{active=false;removeEventListener('photobridge-price-required',show)}},[t?.id,p,Se]);`+hook);
  if(root.endsWith('lab-desktop-ui')){
   s=once(s,"       if(settings.autoPrintMissingPriceTicket)await pb1568Thermal('ticket',id,null);", "       if(!task.pricingPrompted)pb1576QueuePrice(lab,id);\n       if(settings.autoPrintMissingPriceTicket)void pb1568Thermal('ticket',id,null).catch(()=>{});");
   s=once(s,"{phase:'waiting_for_pricing',attempts:0,retryAt:Date.now()+60000}","{phase:'waiting_for_pricing',pricingPrompted:true,attempts:0,retryAt:Date.now()+60000}");
  }
  s+=`\n/* R1576 immediate missing-price dialog */\nfunction pb1576QueuePrice(lab,id){if(!lab||!id)return;const key='pb1576-price:'+lab;let ids;try{ids=JSON.parse(localStorage.getItem(key)||'[]')}catch{ids=[]}if(!Array.isArray(ids))ids=[];if(!ids.includes(id))ids.push(id);localStorage.setItem(key,JSON.stringify(ids));if(!/^\\/lab\\/orders(?:\\/|$)/.test(location.pathname))Dn('/lab/orders/flow');window.pbDesktopEvents?.focusForPricing?.(lab)?.catch(()=>{});dispatchEvent(new CustomEvent('photobridge-price-required',{detail:{labId:lab}}));}\n`;
  write(file,s);
 }
}
const root='dist/web/lab-desktop-ui',asset=root+'/assets/index-UIRefine-v655-r84.js';let s=read(asset);
if(!s.includes('/* R1576 stable native backup */')){
 s=s.replace(/\/\* R1573 native backup \*\/\n\(\(\)=>\{[\s\S]*?\}\)\(\);/,'');
 s+=read('scripts/r1576-native-backup.js.txt');write(asset,s);
}
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/index.html';write(file,read(file).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&priceNow=r1576')?url:url+'&priceNow=r1576'));execFileSync(process.execPath,['--check',root+'/assets/index-UIRefine-v655-r84.js'],{stdio:'inherit'});
}
const path=root+'/manifest.json',manifest=JSON.parse(read(path)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html'])manifest.files.find(row=>row.name===name).sha256=sha(fs.readFileSync(root+'/'+name));manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();write(path,JSON.stringify(manifest));
