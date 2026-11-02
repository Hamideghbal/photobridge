import fs from 'node:fs';
import crypto from 'node:crypto';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),bundle='assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync('dist/web/'+bundle,'utf8');
if(!js.includes('/* PB1546 trusted native order identity */')){
 const old='if(!pb1531Current?.id||pb1531Current.id!==le.id)throw Error("order_not_found");';if(js.split(old).length!==3)throw Error('R1546 ready identity anchors changed');js=js.replaceAll(old,'if(!pb1546SameOrder(le,pb1531Current))throw Error("order_not_found");');
 const lookup='find(r=>r.id===pb1531Current.invoice_id)';if(js.split(lookup).length!==3)throw Error('R1546 existing invoice anchors changed');js=js.replaceAll(lookup,'find(r=>pb1546SameInvoice(r,pb1531Current.invoice_id))');
 js+=`\n/* PB1546 trusted native order identity */
function pb1546Native(){return typeof window!=='undefined'&&Boolean(window.pbNativeFolder||window.__PB_NATIVE_SOURCE_PROOF__)}
function pb1546SameOrder(local,fresh){
 if(!local?.id||!fresh?.id)return false;
 if(local.lab_id&&fresh.lab_id&&String(local.lab_id)!==String(fresh.lab_id))return false;
 if(String(local.id)===String(fresh.id))return true;
 return Boolean(pb1546Native()&&local.serverId&&String(local.serverId)===String(fresh.id)&&(!local.lab_id||String(local.lab_id)===String(fresh.lab_id)));
}
function pb1546SameInvoice(invoice,id){return Boolean(invoice?.id&&id&&(String(invoice.id)===String(id)||pb1546Native()&&invoice.serverId&&String(invoice.serverId)===String(id)))}
`;fs.writeFileSync('dist/web/'+bundle,js);
}
const root='dist/web/lab-desktop-ui',native=js.replace('const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"','const ai=()=>typeof window.showDirectoryPicker=="function"');if(!native.includes('const ai=()=>typeof window.showDirectoryPicker=="function"'))throw Error('R1546 native storage capability changed');fs.writeFileSync(root+'/'+bundle,native);
for(const directory of ['dist/web',root]){let html=fs.readFileSync(directory+'/index.html','utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&mappedInvoice=r1546')?u:u+'&mappedInvoice=r1546');fs.writeFileSync(directory+'/index.html',html)}
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1546 native contract changed');for(const name of [bundle,'index.html']){const entry=manifest.files.find(f=>f.name===name);if(!entry)throw Error('R1546 missing native asset');entry.sha256=hash(fs.readFileSync(root+'/'+name))}manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));
console.log('[PhotoBridge R1546] ready invoice accepts the installed native host trusted local/server mapping');
