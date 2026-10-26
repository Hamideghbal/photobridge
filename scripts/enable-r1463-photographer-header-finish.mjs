import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const file='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(file,'utf8');
const once=(a,b)=>{if(nav.split(a).length!==2)throw Error('R1463 anchor '+a.slice(0,90));nav=nav.replace(a,b)};
if(!nav.includes('/* PB1463 lab label */')){
 once(' function pb1459LabContext(source){',` /* PB1463 lab label */
 function pb1463LabLabel(value){const name=String(value||'').trim().replace(/^لابراتوار(?:\\s+عکس)?(?:\\s+|$)/,'').trim();return 'لابراتوار عکس '+(name||'انتخاب‌شده')}
 function pb1459LabContext(source){`);
 once("context.title=name;", "context.title=pb1463LabLabel(name);");
 once("for(const option of source.options)select.append(option.cloneNode(true));", "for(const option of source.options){const copy=option.cloneNode(true);copy.textContent=pb1463LabLabel(option.textContent);select.append(copy);}");
 once("title.textContent=name;context.append(title)", "title.textContent=pb1463LabLabel(name);context.append(title)");
 fs.writeFileSync(file,nav);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');if(!css.includes('/* PB1463 photographer header finish */')){css+='\n/* PB1463 photographer header finish */\n'+fs.readFileSync('scripts/r1463-photographer-header-finish.css','utf8');fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replace(/(photobridge-r1126-desktop-navigation\.(?:js|css)\?[^"'\s]*)/g,url=>url.includes('headerFinish=r1463')?url:url+'&headerFinish=r1463');fs.writeFileSync(file,html)}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});console.log('[R1463] Single fading dividers, consistent thin mode indicator, centered intake and labeled lab selector.');
