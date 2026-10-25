import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1439 finance toolbar parity */')){
 const once=(a,b)=>{if(ui.split(a).length!==2)throw Error('R1439 anchor '+a.slice(0,80));ui=ui.replace(a,b)};
 once('On,{title:"ثبت اصلاحیه مالی",onClose:','On,{title:"ثبت اصلاحیه مالی",dialogClassName:"pb1439CorrectionForm",onClose:');
 const start=ui.indexOf('className:"statementFilters"'),end=ui.indexOf('className:"statementActions"',start);if(start<0||end<start)throw Error('R1439 statement picker');let part=ui.slice(start,end);const option='children:String(Je.name||"عکاسی")+" · "+String(Je.mobile||"")';if(part.split(option).length!==2)throw Error('R1439 picker option');part=part.replace(option,'children:String(Je.name||"عکاسی")');ui=ui.slice(0,start)+part+ui.slice(end);
 ui+='\n/* PB1439 finance toolbar parity */\n';fs.writeFileSync(file,ui);
}
const headerFile='dist/web/photobridge-r1372-third-header.js';let header=fs.readFileSync(headerFile,'utf8');
if(!header.includes('/* PB1439 manual action stays in invoice toolbar */')){
 const old="root.querySelectorAll('.financeSectionTools>button,.pb1176ManualOpen')";if(header.split(old).length!==2)throw Error('R1439 manual header proxy');header=header.replace(old,"root.querySelectorAll('.financeSectionTools>button')")+'\n/* PB1439 manual action stays in invoice toolbar */\n';fs.writeFileSync(headerFile,header);
}
let html=fs.readFileSync('dist/web/index.html','utf8');if(!html.includes('photobridge-r1439-finance-toolbar-parity.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1439-finance-toolbar-parity.css?v=r1439" /></head>');html=html.replace(/(photobridge-r1372-third-header\.js)(?:\?[^"'<>\s]*)?/g,'$1?v=r1439');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&toolbarParity=')?url:url+'&toolbarParity=r1439');fs.writeFileSync('dist/web/index.html',html);
