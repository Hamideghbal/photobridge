// PhotoBridge R1868: apply customer service terminology and unified RTL dropdowns
// after legacy build writers and the R1867 CRM cache fix.
import fs from 'node:fs';
const file='dist/web/customer-crm.html';
if(!fs.existsSync(file))throw new Error('Missing '+file);
for(const name of ['customer-crm-service-menus-r1868.js','customer-crm-service-menus-r1868.css']){
  if(!fs.existsSync('dist/web/'+name))throw new Error('Missing R1868 asset: '+name);
}
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
if(!revision)throw new Error('DEPLOY_REVISION is blank');
let html=fs.readFileSync(file,'utf8');
const mustReplace=(oldText,newText)=>{
  if(!html.includes(oldText)&&!html.includes(newText))throw new Error('Missing CRM source anchor: '+oldText);
  html=html.replaceAll(oldText,newText);
};
mustReplace('<label>مدل عکاسی</label><select id="session-type"','<label for="session-type">نوع خدمات</label><select id="session-type"');
mustReplace('<label>نوع عکاسی</label><select id="template-type"','<label for="template-type">نوع خدمات</label><select id="template-type"');
html=html.replaceAll('تاریخ عکاسی (شمسی)','تاریخ خدمات (شمسی)');
html=html.replaceAll('صدور فاکتور خدمات عکاسی','صدور فاکتور خدمات');
// Cache-bust even if this step is executed repeatedly.
const css='/customer-crm-service-menus-r1868.css?rev='+encodeURIComponent(revision);
const js='/customer-crm-service-menus-r1868.js?rev='+encodeURIComponent(revision);
const cssTag='<link rel="stylesheet" href="'+css+'">';
const jsTag='<script src="'+js+'" defer></script>';
if(/<link rel="stylesheet" href="\/customer-crm-service-menus-r1868[.]css[^"]*">/.test(html)){
  html=html.replace(/<link rel="stylesheet" href="\/customer-crm-service-menus-r1868[.]css[^"]*">/,cssTag);
}else {
  if(!html.includes('</head>'))throw new Error('Missing CRM head closing tag');
  html=html.replace('</head>',cssTag+'</head>');
}
if(/<script src="\/customer-crm-service-menus-r1868[.]js[^"]*" defer><\/script>/.test(html)){
  html=html.replace(/<script src="\/customer-crm-service-menus-r1868[.]js[^"]*" defer><\/script>/,jsTag);
}else {
  if(!html.includes('</body>'))throw new Error('Missing CRM body closing tag');
  html=html.replace('</body>',jsTag+'</body>');
}
fs.writeFileSync(file,html);
console.log('[R1868] CRM service choices + mobile tabs ready, '+revision);
