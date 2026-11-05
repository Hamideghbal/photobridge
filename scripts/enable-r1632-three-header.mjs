import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const once=(source,before,after)=>{if(source.split(before).length!==2)throw Error('R1632 anchor '+before.slice(0,100));return source.replace(before,after)};
const third=`
  // R1632: Finance sub-tabs belong to a dedicated third header.
  let financeThird=chrome.querySelector('.pb1632FinanceTabs');
  if(!financeThird){financeThird=document.createElement('nav');financeThird.className='pb1632FinanceTabs';financeThird.setAttribute('aria-label','بخش‌های امور مالی');chrome.append(financeThird)}
  const controls=pb1631Finance?[...doc.querySelectorAll('.financeSectionTabs>button')]:[];
  const thirdVisible=controls.length>0;
  financeThird.hidden=!thirdVisible;
  chrome.classList.toggle('pb1632FinanceThird',thirdVisible);
  document.documentElement.classList.toggle('pb1632FinanceThird',thirdVisible);
  if(thirdVisible){
   const next=controls.map(button=>button.textContent.trim()).join('|');
   if(financeThird.dataset.source!==next){
    financeThird.replaceChildren();
    for(const original of controls){const copy=cleanClone(original);copy.removeAttribute('style');copy.classList.add('pb1632FinanceTab');copy.onclick=()=>{if(original.isConnected)original.click();schedule()};financeThird.append(copy)}
    financeThird.dataset.source=next;
   }
   controls.forEach((original,index)=>{
    const copy=financeThird.children[index];if(!copy)return;
    const active=original.classList.contains('active')||original.getAttribute('aria-selected')==='true';
    copy.classList.toggle('active',active);
    if(active)copy.setAttribute('aria-current','page');else copy.removeAttribute('aria-current');
   });
  }
`;
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/photobridge-r1126-desktop-navigation.js';let s=fs.readFileSync(file,'utf8');
 s=once(s,"const sources=choosing?[]:pb1631Finance?['فاکتورها','حساب معین','دریافت‌ها'].map(label=>[...doc.querySelectorAll('.financeSectionTabs>button')].find(button=>button.textContent.trim()===label)).filter(Boolean):active==='store'?","const sources=choosing?[]:active==='store'?");
 s=once(s,"const nativeModes=pb1631Finance?visible.length===3:active==='print'","const nativeModes=active==='print'");
 s=once(s,"const clonedModes=pb1631Finance?row.querySelectorAll('.pb1127PrintModes>button').length===3:!!row.querySelector","const clonedModes=!!row.querySelector");
 s=once(s,"if(utilities){for(const cls of ['finance','archive']){const b=utilities.querySelector('.'+cls);if(b)utilities.append(b);}}","if(utilities){const separator=document.createElement('span');separator.className='pb1632ModeDivider';separator.setAttribute('aria-hidden','true');modes.append(separator);for(const cls of ['finance','archive']){const b=utilities.querySelector('.'+cls);if(b)modes.append(b)}utilities.remove();}");
 s=once(s,'   row.dataset.source=signature;\n  }','   row.dataset.source=signature;\n  }'+third);
 fs.writeFileSync(file,s);execFileSync(process.execPath,['--check',file]);
 const css='photobridge-r1632-three-header.css';fs.copyFileSync('scripts/r1632-three-header.css',root+'/'+css);
 const html=root+'/index.html';s=fs.readFileSync(html,'utf8').replace('</head>',`<link rel="stylesheet" href="/${css}?v=r1632"></head>`).replace(/(photobridge-r1126-desktop-navigation\.js\?[^"']*)/g,'$1&threeHeaders=r1632');fs.writeFileSync(html,s);
}
const root='dist/web/lab-desktop-ui',file=root+'/manifest.json',m=JSON.parse(fs.readFileSync(file)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of ['index.html','photobridge-r1126-desktop-navigation.js','photobridge-r1632-three-header.css']){let row=m.files.find(x=>x.name===name);if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row)}row.sha256=hash(fs.readFileSync(root+'/'+name))}
m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(m));
