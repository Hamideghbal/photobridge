// R1201: immediately acknowledge a walk-in photo/album click while loading live data.
import fs from 'node:fs';
const p='dist/web/photobridge-r1137-lab-local-intake.js';
let s=fs.readFileSync(p,'utf8');
const a='const provider=storage();let directory,bootstrap,loadError;';
const b='const provider=storage();let directory,bootstrap,loadError;\n const pending=node("dialog",null,"pb1137Intake pb1201IntakePending");pending.setAttribute("dir","rtl");pending.setAttribute("aria-label","آماده‌سازی سفارش حضوری");pending.innerHTML=\'<header><h2>ثبت سفارش حضوری</h2></header><div class="pb1201IntakeProgress" role="status" aria-live="polite"><span class="pb1201Spinner" aria-hidden="true"></span>در حال دریافت اطلاعات عکاسی و محل ذخیره‌سازی…</div>\';document.body.append(pending);pending.showModal();';
const end='finally{opening=false;if(launch){launch.disabled=false;launch.textContent=intakeTitle;}}';
if(s.split(a).length!==2||s.split(end).length!==2)throw Error('R1201 intake anchors changed');
s=s.replace(a,b).replace(end,'finally{pending.close();pending.remove();opening=false;if(launch){launch.disabled=false;launch.textContent=intakeTitle;}}');
fs.writeFileSync(p,s);
const bp='dist/web/photobridge-lab-birthday-v774.js';
let birthday=fs.readFileSync(bp,'utf8');
const old="function eligible(){return location.pathname.startsWith('/lab/settings')&&!!document.querySelector('.pageMain')}";
if(birthday.split(old).length!==2)throw Error('R1201 birthday setting anchor changed');
birthday=birthday.replace(old,"function eligible(){return location.pathname.replace(/\\/+$/,'')==='/lab/settings'&&!!document.querySelector('.pageMain')}");
fs.writeFileSync(bp,birthday);
let html=fs.readFileSync('dist/web/index.html','utf8');
const href='/photobridge-r1201-lab-invoice-print.css?v=r1201';
if(!html.includes(href)){if(html.split('</body>').length!==2)throw Error('R1201 HTML end missing');html=html.replace('</body>','<link rel="stylesheet" href="'+href+'">\n</body>');}
fs.writeFileSync('dist/web/index.html',html);
console.log('[R1201] Walk-in loading and General settings controls ready');
