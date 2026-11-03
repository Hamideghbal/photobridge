// R1572: stop Lab finance panels blinking on background events and move
// automation/backup to Settings > General, removing the order-page shortcut.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{if(s.split(a).length!==2)throw Error('R1572 '+label+' anchor changed ('+(s.split(a).length-1)+')');return s.replace(a,b)};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const asset=root+'/assets/index-UIRefine-v655-r84.js';
  let js=read(asset);
  if(!js.includes('/* R1572 finance stable background refresh */')){
    // The finance loader is called by native events and manual navigation. Only
    // initial page load should set a full-screen busy flag. Background refreshes
    // update existing rows in place with no flashing/unmounting.
    js=once(js,'const [pb1569FinanceReady,pb1569SetFinanceReady]=x.useState(false),pb1569LoadedFinanceView=x.useRef(null);',
      'const pb1572FinanceFirstLoad=x.useRef(true);const [pb1569FinanceReady,pb1569SetFinanceReady]=x.useState(false),pb1569LoadedFinanceView=x.useRef(null);',
      'finance ref '+root);
    js=once(js,'pb1472Load=async()=>{var Je;g(!0);try{',
      'pb1472Load=async()=>{var Je;if(pb1572FinanceFirstLoad.current)g(!0);try{',
      'busy on finance refresh '+root);
    const start=js.indexOf('pb1472Load=async()=>{var Je;if(pb1572FinanceFirstLoad.current)');
    const end=js.indexOf('}finally{g(!1)}};',start);
    if(start<0||end<start)throw Error('R1572 finance finally missing '+root);
    js=js.slice(0,end)+js.slice(end).replace('}finally{g(!1)}};',
      '}finally{pb1572FinanceFirstLoad.current=false;g(!1)}};');
    // Keep the two settings in General, as regular section tabs with the other
    // General controls. No stand-alone button in Print or in settings nav.
    // Locate the General settings group's item array structurally; other build
    // layers may change the last General option or its display label.
    const generalStart=js.indexOf('key:"general",label:"عمومی"');
    const nextCategory=generalStart<0?-1:js.indexOf('},{key:',generalStart);
    const itemsEnd=nextCategory<0?-1:js.lastIndexOf(']]',nextCategory);
    if(generalStart<0||nextCategory<0||itemsEnd<generalStart)
      throw Error('R1572 settings General group not found '+root);
    if(js.slice(generalStart,itemsEnd).includes('["automation"')||js.slice(generalStart,itemsEnd).includes('["backup"'))
      throw Error('R1572 duplicate General option '+root);
    js=js.slice(0,itemsEnd+1)+',["automation","دانلود و چاپ خودکار"],["backup","پشتیبان اطلاعات برنامه"]'+js.slice(itemsEnd+1);
    // There may be no System category in the final compiled variant. Remove
    // any *other* backup item in the settings menu region after the new General
    // tab; never target the new General entry itself.
    const generalBackup='["backup","پشتیبان اطلاعات برنامه"]';
    const generalBackupEnd=js.indexOf(generalBackup)+generalBackup.length;
    if(generalBackupEnd<generalBackup.length)throw Error('R1572 General backup missing '+root);
    const laterMenu=js.slice(generalBackupEnd,generalBackupEnd+2500);
    const cleanedMenu=laterMenu.replace(/,\["backup","[^"]*"\]/g,'');
    js=js.slice(0,generalBackupEnd)+cleanedMenu+js.slice(generalBackupEnd+2500);
    js+='\n/* R1572 finance stable background refresh */\n';
    write(asset,js);
    execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
  }
  const htmlPath=root+'/index.html';let html=read(htmlPath);
  html=html.replace(/<script defer src="\/photobridge-r1570-automation-entry\.js\?v=r1570"><\/script>\s*/g,'');
  html=html.replace(/<link rel="stylesheet" href="\/photobridge-r1570-automation-entry\.css\?v=r1570">\s*/g,'');
  html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g,url=>url.includes('&stableFinance=r1572')?url:url+'&stableFinance=r1572');
  write(htmlPath,html);
}
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
const manifest=JSON.parse(read(manifestPath));
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
  const item=manifest.files.find(row=>row.name===name);
  if(!item)throw Error('R1572 native manifest file missing '+name);
  item.sha256=sha(fs.readFileSync(native+'/'+name));
}
manifest.build=sha(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(manifestPath,JSON.stringify(manifest));
console.log('[R1572] finance refresh stays mounted; automation and backup are General sub-tabs only');
