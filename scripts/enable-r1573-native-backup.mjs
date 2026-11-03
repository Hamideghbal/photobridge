// Keep the native executable's real backup page; the website export stays web-only.
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='dist/web/lab-desktop-ui',asset=root+'/assets/index-UIRefine-v655-r84.js';
let source=fs.readFileSync(asset,'utf8');
const entry=',["backup","پشتیبان اطلاعات برنامه"]';
if(!source.includes('/* R1573 native backup */')){
 if(source.split(entry).length!==2)throw Error('R1573 native General backup anchor changed');
 source=source.replace(entry,'');
 source+=`\n/* R1573 native backup */\n(()=>{let queued=false;function mount(){queued=false;const active=/^\\/lab\\/settings\\/automation\\/?$/.test(location.pathname);let button=document.getElementById('pb1573NativeBackup');if(!active){button?.remove();return}const host=document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader')||document.querySelector('.labRoleWorkspace .settingsBody');if(!host)return;if(!button){button=document.createElement('a');button.id='pb1573NativeBackup';button.href='/desktop/backups';button.textContent='پشتیبان اطلاعات برنامه';button.className='btn';button.style.cssText='display:inline-flex;align-items:center;margin:6px;padding:10px 14px;border:1px solid #d5deef;border-radius:11px;color:#315efb;background:#eef3ff;font:600 13px Vazirmatn,Tahoma;text-decoration:none';host.append(button)}}function schedule(){if(!queued){queued=true;requestAnimationFrame(mount)}}new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});addEventListener('popstate',schedule);schedule()})();\n`;
 fs.writeFileSync(asset,source);
}
const html=root+'/index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replace(/(stableFinance=r1572)(?!&nativeBackup)/g,'$1&nativeBackup=r1573'));
const p=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(p));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){const item=manifest.files.find(x=>x.name===name);if(!item)throw Error('missing native manifest entry');item.sha256=sha(fs.readFileSync(root+'/'+name))}
manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(p,JSON.stringify(manifest));
