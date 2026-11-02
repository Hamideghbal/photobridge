import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex'),file='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(file,'utf8');
if(!js.includes('/* PB1541 aligned tariff headers */')){
 const start=js.indexOf('function tw({'),end=js.indexOf('function Na(t)',start);if(start<0||end<=start)throw Error('R1541 tariff component changed');let component=js.slice(start,end);
 const head=component.indexOf('className:"priceGrid inventoryPriceGrid head"'),a=component.indexOf('h.map(([k,E])=>',head),b=component.indexOf(']},k))',a)+6;if(head<0||a<head||b<a||!component.slice(a,b).includes('pb1540BindingDelete'))throw Error('R1541 header controls changed');
 const icon=d=>`e.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,"aria-hidden":"true",children:e.jsx("path",{d:${JSON.stringify(d)}})})`;
 const edit=icon('m15 4 5 5M4 20l4-1 12-12-4-4L4 15v5Z'),trash=icon('M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7');
 const header=`h.map(([k,E])=>e.jsxs("b",{children:[e.jsx("span",{className:"pb1541TariffTitle",title:E,children:E}),e.jsxs("span",{className:"pb1541TariffActions",children:[(k==="album_binding_price"||k.startsWith("pb1539_"))&&e.jsx("button",{type:"button",className:"pb1539Rename",title:"ویرایش نام صحافی","aria-label":"ویرایش نام صحافی "+E,onClick:()=>pb1539Rename(k.startsWith("pb1539_")?k.slice(7):k,E),children:${edit}}),k.startsWith("pb1539_")&&e.jsx("button",{type:"button",className:"pb1540BindingDelete",title:"حذف مدل صحافی","aria-label":"حذف صحافی "+E,onClick:()=>pb1539Delete(k.slice(7),E),children:${trash}})]})]},k))`;
 component=component.slice(0,a)+header+component.slice(b);js=js.slice(0,start)+component+js.slice(end)+'\n/* PB1541 aligned tariff headers */\n';fs.writeFileSync(file,js);
}
const css='photobridge-r1541-tariff-columns.css',htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');if(!html.includes(css))html=html.replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1541"></head>`);html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&tariffColumns=r1541')?u:u+'&tariffColumns=r1541');fs.writeFileSync(htmlFile,html);
// Include the exact same table fix in the Windows hot-update payload. Updating
// the site's late CSS alone does not update the independently frozen native UI.
const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));if(manifest.protocol!==1||manifest.channel!=='lab')throw Error('R1541 invalid native channel');
for(const name of ['assets/index-UIRefine-v655-r84.js',css]){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync('dist/web/'+name,target);if(name==='assets/index-UIRefine-v655-r84.js'){
 let nativeJs=fs.readFileSync(target,'utf8');const phone='const ai=()=>!pb1483Phone()&&typeof window.showDirectoryPicker=="function"',desktop='const ai=()=>typeof window.showDirectoryPicker=="function"';
 if(nativeJs.includes(phone)){if(nativeJs.split(phone).length!==2)throw Error('R1541 ambiguous storage capability');nativeJs=nativeJs.replace(phone,desktop);}else if(!nativeJs.includes(desktop))throw Error('R1541 unsupported native storage capability');
 fs.writeFileSync(target,nativeJs);
}const entry=manifest.files.find(f=>f.name===name);if(entry)entry.sha256=hash(fs.readFileSync(target));else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:hash(fs.readFileSync(target))});}
let nativeHtml=fs.readFileSync(root+'/index.html','utf8');if(!nativeHtml.includes(css))nativeHtml=nativeHtml.replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1541"></head>`);nativeHtml=nativeHtml.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&tariffColumns=r1541')?u:u+'&tariffColumns=r1541');fs.writeFileSync(root+'/index.html',nativeHtml);manifest.files.find(f=>f.name==='index.html').sha256=hash(nativeHtml);manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(root+'/manifest.json',JSON.stringify(manifest));
