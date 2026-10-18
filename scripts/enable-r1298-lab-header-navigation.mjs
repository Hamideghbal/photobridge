import fs from 'node:fs';
const file='dist/web/photobridge-r1147-lab-admin-header.js';let src=fs.readFileSync(file,'utf8');
const old="button.onclick=()=>{const original=document.querySelectorAll('.labSettingsCategoryTabs>button')[index];if(original)original.click();else navigate(path);};";
const fixed='button.onclick=()=>navigate(path);';
if(src.includes(old))src=src.replace(old,fixed);else if(!src.includes(fixed))throw Error('R1298 header category navigation anchor changed');
const listener=src.indexOf("nav.addEventListener('click',e=>{");
if(listener>=0){const end=src.indexOf('h.append(nav);',listener);if(end<0||end-listener>1000)throw Error('R1298 header animation anchor changed');src=src.slice(0,listener)+'/* PB1188 no animation on the full laboratory scroll viewport */'+src.slice(end);}
const oldCategories="['مسیر ذخیره روی هارد','/lab/settings/local',['local']]];";
const newCategories="['مسیر ذخیره روی هارد','/lab/settings/local',['local']],['سایت اختصاصی','/lab/settings/site',['site']]];";
if(src.includes(oldCategories))src=src.replace(oldCategories,newCategories);else if(!src.includes(newCategories))throw Error('R1298 site header category anchor changed');
// Settings content remains still; retain the lightweight button feedback.
const motion="if(changed&&!matchMedia('(prefers-reduced-motion:reduce)').matches){\n     requestAnimationFrame";
src=src.replace(motion,"if(changed&&!location.pathname.startsWith('/lab/settings')&&!matchMedia('(prefers-reduced-motion:reduce)').matches){\n     requestAnimationFrame");
fs.writeFileSync(file,src);
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(photobridge-r1147-lab-admin-header\.js\?[^"']*)/g,u=>u.replace(/&navigation=[^&"']*/g,'').replace(/&buildCompat=[^&"']*/g,'')+'&navigation=r1298&buildCompat=r1300');fs.writeFileSync(index,html);
