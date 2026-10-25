import fs from 'node:fs';
const file='dist/web/photobridge-r1372-third-header.js';
let js=fs.readFileSync(file,'utf8');
if(!js.includes('/* PB1425 finance second row */')){
 const once=(a,b)=>{if(js.split(a).length!==2)throw Error('R1425 header anchor changed: '+a);js=js.replace(a,b)};
 once("function clear(root){","function clear(root){root.classList.remove('pb1425PromotedSecond');");
 once("if(!header||!second||!data){clear(root);return}","if(!header||!second||!data){clear(root);return}\n /* PB1425 finance second row */\n root.classList.toggle('pb1425PromotedSecond',data.kind==='finance'||data.kind==='customers');");
 once("const top=Math.ceil(second.getBoundingClientRect().bottom);","const top=Math.ceil(((data.kind==='finance'||data.kind==='customers')?header:second).getBoundingClientRect().bottom);");
 fs.writeFileSync(file,js);
}

const customerAnchor="const customers=root.querySelector('.labCustomerSubnav');if(customers)return {source:customers,kind:'customers',title:'عکاسان و همکاری',selector:':scope>button'};";
if(!js.includes('function pb1425CustomersSource')){
 if(!js.includes(customerAnchor))throw Error('R1425 customer source changed');
 js=js.replace(customerAnchor,"const customers=root.querySelector('.labCustomerSubnav');if(customers||new RegExp('^/lab/settings/(?:customers|walkin)(?:/|$)').test(location.pathname))return {source:pb1425CustomersSource(root,customers),kind:'customers',title:'',selector:':scope>button'};");
 js=js.replace('function buttonSource(root){',`function pb1425CustomersSource(root,native){
 let source=root.querySelector('.pb1425CustomerTabs');
 if(!source){source=document.createElement('nav');source.className='pb1425CustomerTabs';source.hidden=true;
 for(const [index,label,path] of [[0,'عکاس‌ها','/lab/settings/customers/photographers'],[1,'دعوت‌نامه','/lab/settings/customers/invites'],[2,'دفتر همکاری','/lab/settings/customers/collaboration'],[3,'مشتری آزاد','/lab/settings/walkin']]){
 const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{const live=root.querySelectorAll('.labCustomerSubnav>button')[index];if(index<3&&live){live.click();return}if(location.pathname!==path){history.pushState(null,'',path);dispatchEvent(new PopStateEvent('popstate'));}};source.append(button);}
 root.querySelector('main').append(source);}
 const active=location.pathname.includes('/walkin')?3:location.pathname.includes('/invites')||location.hash==='#customers-invites'?1:location.pathname.includes('/collaboration')||location.hash==='#customers-collaboration'?2:0;
 [...source.children].forEach((button,i)=>button.classList.toggle('active',i===active));
 return source;
}
function buttonSource(root){`);
 fs.writeFileSync(file,js);
}

const cssFile='dist/web/photobridge-r1372-third-header.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1425 finance second row */'))fs.appendFileSync(cssFile,`
/* PB1425 finance second row */
@media(min-width:821px) and (hover:hover) and (pointer:fine){
 html body #root .labRoleWorkspace.pb1425PromotedSecond :is(.pb1148SecondaryHeader,.labCustomerSectionMenu){display:none!important}
}
`);
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/(photobridge-r1372-third-header\\.(?:js|css))(?:\\?[^"'<>\\s]*)?/g,'$1?v=r1425');
fs.writeFileSync('dist/web/index.html',html);
