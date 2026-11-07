/* R1658: three smaller album pages per row, one add button and compact
 * resume warning inside the album configurator. Price aside is untouched.
 * Runs after R1657 so earlier React and navigation patches keep their anchors.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const bundle='assets/index-UIRefine-v655-r84.js';
const style='photobridge-r1658-album-compact-three-up.css';
function once(s,from,to,label,root){
 const count=s.split(from).length-1;
 if(count!==1)throw Error('R1658 '+label+' '+root+' anchor count '+count);
 return s.replace(from,to);
}
const notice='Y==="error"&&e.jsxs("div",{className:"albumUploadResumeNotice",role:"alert",children:[e.jsx("b",{children:"ارسال متوقف شده اما فایل‌های کامل حذف نشده‌اند."}),e.jsx("span",{children:N}),e.jsx("button",{type:"button",onClick:()=>void xe(),children:"↻ ادامه ارسال"})]}),';
const folder='e.jsx("button",{type:"button",className:"albumFileToolAction add albumFileActionFolder",title:"افزودن پوشه","aria-label":"افزودن پوشه",onClick:()=>{var $e;return($e=ke.current)==null?void 0:$e.click()},children:"＋ افزودن پوشه"}),';
const add='e.jsx("button",{type:"button",className:"albumFileToolAction add albumFileActionFile",title:"افزودن فایل","aria-label":"افزودن فایل",onClick:()=>{var $e;return($e=ve.current)==null?void 0:$e.click()},children:"＋ افزودن فایل"}),';
const block='e.jsxs("div",{className:"albumConfigBlock albumConfigBlockCompactV409"';
const compactNotice=notice.replace('ارسال متوقف شده اما فایل‌های کامل حذف نشده‌اند.','ارسال متوقف شد؛ فایل‌ها حفظ شدند.').replace('↻ ادامه ارسال','ادامه ارسال');
const newAdd=add.replaceAll('افزودن فایل','افزودن برگه آلبوم');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const bundlePath=root+'/'+bundle;
 let js=fs.readFileSync(bundlePath,'utf8');
 if(js.includes('/* PB1658 three-up album pages */'))throw Error('R1658 applied twice '+root);
 const beforeQuote=js.slice(js.indexOf('e.jsxs("aside",{className:"card panel albumQuoteCard"'));
 js=once(js,notice,'','remove external upload notice',root);
 js=once(js,block,compactNotice+block,'place inline upload notice inside configurator',root);
 js=once(js,folder,'','remove Add Folder button',root);
 js=once(js,add,newAdd,'rename only Add Album Page button',root);
 if(!js.includes('className:"albumFileGrid albumFileQcGrid"')||
    !js.includes('className:"card panel albumQuoteCard"')||
    !js.includes('albumUploadResumeNotice'))
  throw Error('R1658 album markup contract missing '+root);
 if(js.slice(js.indexOf('e.jsxs("aside",{className:"card panel albumQuoteCard"'))!==beforeQuote)
  throw Error('R1658 price breakdown changed '+root);
 js+='\n/* PB1658 three-up album pages */\n';
 fs.writeFileSync(bundlePath,js);
 execFileSync(process.execPath,['--check',bundlePath],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1658-album-compact-three-up.css',root+'/'+style);
 const htmlPath=root+'/index.html';
 let html=fs.readFileSync(htmlPath,'utf8');
 if(!html.includes('</head>')||html.includes('/'+style+'?'))throw Error('R1658 duplicate/missing stylesheet '+root);
 html=html.replace('</head>','<link rel="stylesheet" href="/'+style+'?v=r1658"></head>');
 let entries=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,u=>{
  entries++;return u.includes('&albumThreeUp=r1658')?u:u+'&albumThreeUp=r1658';
 });
 if(entries!==1)throw Error('R1658 expected one JS cache marker '+root+' count '+entries);
 fs.writeFileSync(htmlPath,html);
 if(root.endsWith('/lab-desktop-ui')){
  const manifestPath=root+'/manifest.json',m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(m.protocol!==1||m.channel!=='lab'||!Array.isArray(m.files))throw Error('R1658 native manifest invalid');
  for(const name of ['index.html',bundle,style]){
   let item=m.files.find(f=>f.name===name);
   if(!item){item={name,url:'/lab-desktop-ui/'+name};m.files.push(item);}
   item.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  m.build=hash(JSON.stringify(m.files));
  m.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifestPath,JSON.stringify(m));
 }
}
console.log('[R1658] Three album pages per row, one Add Album Page button, inline resume warning, quote unchanged.');
