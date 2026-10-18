import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
const before='function Dn(t,a=!1){var c,m,g,p;if(cy(t))return;';
const after='function Dn(t,a=!1){var c,m,g,p;if(cy(t))return;if(/^\\/lab\\/(?:settings(?:\\/|$)|wallet(?:\\/|$))/.test(location.pathname)&&/^\\/lab\\/(?:settings(?:\\/|$)|wallet(?:\\/|$))/.test(t)){history[a?"replaceState":"pushState"](null,"",t);window.dispatchEvent(new PopStateEvent("popstate"));return}';
if(!ui.includes(after)){if(ui.split(before).length!==2)throw Error('R1297 settings navigation anchor changed');ui=ui.replace(before,after);fs.writeFileSync(file,ui);}
const p='dist/web/index.html';let html=fs.readFileSync(p,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&settingsSpeed=[^&"']*/g,'')+'&settingsSpeed=r1297');fs.writeFileSync(p,html);
