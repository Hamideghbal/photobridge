import fs from 'node:fs';
const file='dist/web/photobridge-r1372-third-header.js';
let js=fs.readFileSync(file,'utf8');
if(!js.includes('/* PB1425 finance second row */')){
 const once=(a,b)=>{if(js.split(a).length!==2)throw Error('R1425 header anchor changed: '+a);js=js.replace(a,b)};
 once("function clear(root){","function clear(root){root.classList.remove('pb1425FinanceSecond');");
 once("if(!header||!second||!data){clear(root);return}","if(!header||!second||!data){clear(root);return}\n /* PB1425 finance second row */\n root.classList.toggle('pb1425FinanceSecond',data.kind==='finance');");
 once("const top=Math.ceil(second.getBoundingClientRect().bottom);","const top=Math.ceil((data.kind==='finance'?header:second).getBoundingClientRect().bottom);");
 fs.writeFileSync(file,js);
}
const cssFile='dist/web/photobridge-r1372-third-header.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1425 finance second row */'))fs.appendFileSync(cssFile,`
/* PB1425 finance second row */
@media(min-width:821px) and (hover:hover) and (pointer:fine){
 html body #root .labRoleWorkspace.pb1425FinanceSecond .pb1148SecondaryHeader{display:none!important}
}
`);
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/(photobridge-r1372-third-header\\.(?:js|css))(?:\\?[^"'<>\\s]*)?/g,'$1?v=r1425');
fs.writeFileSync('dist/web/index.html',html);
