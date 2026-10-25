import fs from 'node:fs';
function once(text,a,b){if(text.split(a).length!==2)throw Error('R1433 changed anchor: '+a);return text.replace(a,b)}
const headerFile='dist/web/photobridge-r1372-third-header.js';let header=fs.readFileSync(headerFile,'utf8');
if(!header.includes('/* PB1433 album navigation priority */')){
 const pricing="const pricing=root.querySelector('.labPrintPricingCard>.panelHead');if(pricing)return {source:pricing,kind:'pricing',title:'تعرفه چاپ و سایز',selector:'.priceCatalogActions>button'};";
 const album="const album=root.querySelector('.albumSettingsInnerTabs');if(album)return {source:album,kind:'album',title:'تنظیمات آلبوم',selector:':scope>button'};";
 header=once(header,pricing+'\n '+album,'/* PB1433 album navigation priority */\n '+album+'\n '+pricing);
 header=once(header,'function clear(root){',"function clear(root){root.classList.remove('pb1433AlbumThird');");
 header=once(header,"root.classList.toggle('pb1429InlineThird',inline);","root.classList.toggle('pb1429InlineThird',inline);root.classList.toggle('pb1433AlbumThird',data.kind==='album');row.classList.toggle('pb1433AlbumRow',data.kind==='album');");
 fs.writeFileSync(headerFile,header);
}
const queueFile='dist/web/photobridge-r1363-lab-queue.js';let queue=fs.readFileSync(queueFile,'utf8');
if(!queue.includes('/* PB1433 settled content edge */')){
 queue=once(queue,"const value=(edge+(toolbar?Math.ceil(toolbar.getBoundingClientRect().height):0))+'px';","/* PB1433 settled content edge */\n const value=Math.ceil(toolbar?Math.max(edge,toolbar.getBoundingClientRect().bottom):edge)+'px';\n if(main.style.getPropertyValue('--pb1433-content-top')!==value)main.style.setProperty('--pb1433-content-top',value);");
 queue=once(queue,"attributeFilter:['class','hidden']","attributeFilter:['class','hidden','style']");
 fs.writeFileSync(queueFile,queue);
}
const cssFile='dist/web/photobridge-r1423-finance-bars.css';
if(!fs.readFileSync(cssFile,'utf8').includes('/* PB1433 settled header boundaries'))fs.appendFileSync(cssFile,"\n/* PB1433 settled header boundaries and matching customer pickers */\n@media(min-width:821px) and (hover:hover) and (pointer:fine){\n html.pb1363OrderQueue body #root .labRoleWorkspace main.appWorkspacePage.pbFixedRoleHeader>.labRolePageScrollArea,\n html.pb1363OrderQueue body #root .labRoleWorkspace main.appWorkspacePage.pbFixedRoleHeader>.labRolePageScrollArea:has(.financeWorkspace :is(.pb1176PaymentActions,.statementToolbar,.pb1423InvoiceToolbar)){\n top:var(--pb1433-content-top,var(--pb1363-order-top,120px))!important;\n }\n html body #root .labRoleWorkspace .pb1372ThirdHeader.pb1433AlbumRow{\n position:fixed!important;inset-inline:0!important;width:auto!important;height:44px!important;min-height:44px!important;margin:0!important;padding:4px 18px!important;background:#fff!important;\n }\n html body #root .labRoleWorkspace.pb1433AlbumThird .albumSettingsInnerTabs{display:none!important}\n}\nhtml body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace :is(.pb1423InvoiceToolbar .pb1427InvoiceCustomerSelect,.pb1176PaymentActions>select){\n box-sizing:border-box!important;min-height:34px!important;height:34px!important;padding:5px 10px!important;margin:0!important;\n font:800 11px/1.35 Vazirmatn,Tahoma,sans-serif!important;letter-spacing:normal!important;color:#344054!important;background:#fff!important;border:1px solid #d3def2!important;border-radius:8px!important;box-shadow:none!important;direction:rtl!important;text-align:start!important;appearance:auto!important;\n}\n@media(min-width:821px) and (hover:hover) and (pointer:fine){\n html body #root .labRoleWorkspace .labRolePageScrollArea .financeWorkspace :is(.pb1423InvoiceToolbar .pb1427InvoiceCustomerSelect,.pb1176PaymentActions>select){\n flex:0 1 220px!important;width:220px!important;min-width:150px!important;max-width:300px!important;\n }\n}\n");
let html=fs.readFileSync('dist/web/index.html','utf8');
for(const name of ['photobridge-r1372-third-header.js','photobridge-r1363-lab-queue.js','photobridge-r1423-finance-bars.css']){
 const pattern=new RegExp('('+name.replaceAll('.','\\.')+')(?:\\?[^"\'<>\\s]*)?','g');html=html.replace(pattern,'$1?v=r1433');
}fs.writeFileSync('dist/web/index.html',html);
