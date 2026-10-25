import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
const message='این مرورگر از انتخاب پوشه و ذخیره مستقیم عکس‌ها پشتیبانی نمی‌کند. سایت را در مرورگر Google Chrome به‌روز روی کامپیوتر باز کنید، وارد حساب لابراتوار شوید و دوباره «انتخاب مسیر» را بزنید. اگر لینک را داخل پیام‌رسان باز کرده‌اید، آدرس سایت را کپی و مستقیماً در Chrome باز کنید. برای استفاده از نسخه مرورگر، نصب برنامه ویندوز الزامی نیست.';
function once(a,b){if(ui.split(a).length!==2)throw Error('R1453 anchor '+a.slice(0,90));ui=ui.replace(a,b)}
if(!ui.includes('/* PB1453 browser folder help */')){
 once('async function pb1451ChooseRaw(){',`async function pb1451ChooseRaw(){
 if(!window.pbNativeFolder&&typeof window.showDirectoryPicker!=='function')throw Error(pb1453FolderHelp());`);
 once("children:'پوشه را یک بار در مرورگر و یک بار در برنامه ویندوز انتخاب کنید. اگر همان پوشه باشد، هر دو فعال می‌مانند.'",`children:window.pbNativeFolder?'پوشه ذخیره عکس‌ها را در همین برنامه انتخاب کنید. اگر از نسخه مرورگر هم استفاده می‌کنید، برای دسترسی به همان فایل‌ها همان پوشه را در مرورگر انتخاب کنید.':'برای ذخیره مستقیم عکس‌ها روی هارد، سایت را در Google Chrome به‌روز روی کامپیوتر باز و پوشه ذخیره‌سازی را انتخاب کنید. نصب برنامه ویندوز برای استفاده از نسخه مرورگر الزامی نیست.'`);
 once("error&&e.jsx('p',{role:'alert',children:error}),e.jsx(PB1386ArchiveSettings", `(!window.pbNativeFolder&&typeof window.showDirectoryPicker!=='function'||error)&&e.jsx('p',{role:'alert',children:!window.pbNativeFolder&&typeof window.showDirectoryPicker!=='function'?pb1453FolderHelp():error}),e.jsx(PB1386ArchiveSettings`);
 // All download/archive error mappings give the same actionable guidance.
 ui=ui.replaceAll("folder_picker_unsupported:'بررسی فایل‌های پوشه و شروع چاپ باید در برنامه ویندوز یا مرورگر دسکتاپ سیستم اصلی انجام شود.'",'folder_picker_unsupported:'+JSON.stringify(message));
 ui+='\n/* PB1453 browser folder help */\nfunction pb1453FolderHelp(){return '+JSON.stringify(message)+'}\n';
 fs.writeFileSync(file,ui);
}
const html='dist/web/index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replaceAll('downloadRepair=r1452','downloadRepair=r1453'));
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});console.log('[R1453] Browser folder support guard and Persian Chrome guidance ready.');
