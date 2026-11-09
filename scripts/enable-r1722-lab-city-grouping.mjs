// R1722: Group visible labs by city only when 2+ actual city names are present.
// Shared web UI for mobile and desktop. Does not change APIs or Windows builds.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/photobridge-v904r99-lab-chooser.js';
let source=fs.readFileSync(file,'utf8');
function one(before,after,label){
  const n=source.split(before).length-1;
  if(n!==1)throw Error('[R1722] '+label+' anchor count '+n);
  source=source.replace(before,after);
}
if(!source.includes('/* PB1722 city filters */')){
  one(
    "  let running=false,lastPath='',runEpoch=0,currentData=null,refreshQueued=false;",
    "  let running=false,lastPath='',runEpoch=0,currentData=null,refreshQueued=false,selectedCityKey='';",
    'city chooser state'
  );
  const cityHelpers=[
    '  /* PB1722 city filters */',
    "  const noCityKey='__pb_city_unregistered__';",
    "  const cityName=x=>String(x?.city||'').normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/\\s+/g,' ').trim();",
    "  const cityKey=x=>cityName(x)?cityName(x).toLocaleLowerCase('fa'):noCityKey;",
    '  function cityGrouping(all,active,primary){',
    '    const cities=new Map();',
    '    for(const lab of all){',
    '      const name=cityName(lab),key=cityKey(lab);',
    "      const existing=cities.get(key)||{key,name:name||'شهر نامشخص',count:0};",
    '      existing.count++;cities.set(key,existing);',
    '    }',
    "    // Unregistered locations alone do not establish a second distinct city.",
    "    if([...cities.keys()].filter(key=>key!==noCityKey).length<2){selectedCityKey='';return {filter:null,menu:''}}",
    "    const sorted=[...cities.values()].sort((a,b)=>a.key===noCityKey?1:b.key===noCityKey?-1:a.name.localeCompare(b.name,'fa'));",
    '    if(!cities.has(selectedCityKey)){',
    '      const selected=all.find(lab=>String(lab.id)===active)||all.find(lab=>String(lab.id)===primary)||all.find(lab=>lab.connected)||all[0];',
    '      selectedCityKey=cityKey(selected);',
    '    }',
    '    const buttons=sorted.map(city=>`<button type="button" class="pbR99CityTab${city.key===selectedCityKey?\' active\':\'\'}" data-lab-city="${esc(city.key)}" aria-pressed="${city.key===selectedCityKey?\'true\':\'false\'}">${esc(city.name)} <span class="pbR99CityCount">${Number(city.count).toLocaleString(\'fa-IR\')}</span></button>`).join(\'\');',
    '    return {filter:selectedCityKey,menu:`<section class="pbR99CityChooser" aria-label="انتخاب شهر لابراتوار"><div class="pbR99CityTitle"><b>انتخاب شهر</b><span>لابراتوارهای شهر موردنظر را ببین</span></div><nav class="pbR99CityTabs" aria-label="شهرهای لابراتوار">${buttons}</nav></section>`};',
    '  }'
  ].join('\n');
  one('  function card(x,{connected=false,current=false,discover=false}={}){',cityHelpers+'\n  function card(x,{connected=false,current=false,discover=false}={}){','city helpers before card');
  const paintStart="    const active=String(data.activeLabId||connected.find(x=>x.selected)?.id||'');";
  const paintEnd='    try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({data,at:Date.now()}))}catch{}';
  const start=source.indexOf(paintStart),end=source.indexOf(paintEnd,start);
  if(start<0||end<=start||source.indexOf(paintStart,start+1)!==-1)throw Error('[R1722] chooser paint anchors changed');
  const paint=[
    "    const active=String(data.activeLabId||connected.find(x=>x.selected)?.id||'');",
    '    const group=cityGrouping(all,active,primary);',
    '    const visibleConnected=group.filter?connected.filter(lab=>cityKey(lab)===group.filter):connected;',
    '    const visibleAvailable=group.filter?available.filter(lab=>cityKey(lab)===group.filter):available;',
    "    const board=root.querySelector('.pbR99LabBoard');",
    '    const connectedMarkup=visibleConnected.length?`<div class="pbR99LabList">${visibleConnected.map(x=>card(x,{connected:true,current:String(x.id)===active})).join(\'\')}</div>`:visibleAvailable.length?\'\':\'<div class="pbR99LabEmpty">هنوز به لابراتواری متصل نیستی.</div>\';',
    '    const availableMarkup=visibleAvailable.length?`<h2 class="pbR99LabSectionTitle">لابراتوارهای قابل درخواست</h2><div class="pbR99LabList">${visibleAvailable.map(x=>card(x,{discover:Boolean(data.canDiscoverLabs)})).join(\'\')}</div>`:\'\';',
    '    board.innerHTML=group.menu+connectedMarkup+availableMarkup;',
    ''
  ].join('\n');
  source=source.slice(0,start)+paint+source.slice(end);
  one(
    "    runEpoch++;\n    document.getElementById(ROOT_ID)?.remove();",
    "    runEpoch++;selectedCityKey='';\n    document.getElementById(ROOT_ID)?.remove();",
    'reset chooser when leaving'
  );
  one(
    "    const root=document.getElementById(ROOT_ID);if(!root)return;\n    const sel=e.target.closest('[data-select]');",
    [
      '    const root=document.getElementById(ROOT_ID);if(!root)return;',
      "    const city=e.target.closest('[data-lab-city]');",
      "    if(city){const key=String(city.dataset.labCity||'');if(key!==selectedCityKey&&currentData){selectedCityKey=key;paint(currentData)}return}",
      "    const sel=e.target.closest('[data-select]');"
    ].join('\n'),
    'city button event'
  );
  const cityCSS=[
    '      /* PB1722 city selector shared by mobile and desktop. */',
    '      .pbR99CityChooser{margin:1px 0 17px;padding:12px;border:1px solid #cbdcf8;border-radius:15px;background:#fff}',
    '      .pbR99CityTitle{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin:0 0 9px;color:#344054;font-size:12px}',
    '      .pbR99CityTitle span{color:#667085;font-size:9.5px}',
    '      .pbR99CityTabs{display:flex;flex-wrap:wrap;gap:8px;direction:rtl}',
    '      .pbR99CityTab{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:39px;padding:7px 13px;border-radius:11px;border:1px solid #d7e1ef;background:#f7f9fd;color:#344054;cursor:pointer;font:850 11px Vazirmatn,Tahoma,sans-serif}',
    '      .pbR99CityTab.active,.pbR99CityTab[aria-pressed="true"]{border-color:#315efb;background:#315efb;color:#fff}',
    '      .pbR99CityCount{display:inline-grid;place-items:center;min-width:21px;height:21px;padding:0 5px;border-radius:99px;background:rgba(49,94,251,.10);font-size:10px}',
    '      .pbR99CityTab.active .pbR99CityCount{background:rgba(255,255,255,.2)}',
    '      @media(max-width:820px){.pbR99CityChooser{padding:10px;margin-bottom:13px}.pbR99CityTabs{gap:6px}.pbR99CityTab{min-height:40px;flex:1 1 auto;padding:7px 10px;font-size:11px}}',
    ''
  ].join('\n');
  one('    `;document.head.appendChild(s);',cityCSS+'    `;document.head.appendChild(s);','chooser styles');
  fs.writeFileSync(file,source);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
// Bump web loader URL for the city chooser but do not copy to the Windows bundles.
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
const url=/photobridge-v904r99-lab-chooser\.js\?v=[^"'<>\s]+/g;
const found=[...html.matchAll(url)];
if(found.length!==1)throw Error('[R1722] chooser script reference count '+found.length);
html=html.replace(url,'photobridge-v904r99-lab-chooser.js?v=r1722');
fs.writeFileSync(htmlFile,html);
console.log('[R1722] Conditional Lab city selector for mobile and desktop web, unchanged API and Windows.');
