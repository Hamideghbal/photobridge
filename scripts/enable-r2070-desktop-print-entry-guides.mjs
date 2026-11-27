import fs from 'node:fs';
import zlib from 'node:zlib';
import {execFileSync} from 'node:child_process';
function one(s,a,b,label){if(s.split(a).length!==2)throw Error('[R2070] '+label+' anchor '+(s.split(a).length-1));return s.replace(a,()=>b)}
function bundlePatch(ui){
 if(ui.includes('/* PB2070 desktop entry */'))return ui;
 const start=ui.indexOf('function ej('),end=ui.indexOf('function vh(',start);
 if(start<0||end<=start)throw Error('composer region');
 let part=ui.slice(start,end);
 if(!part.includes('pb1793SetStandalone')||!part.includes('PB1793AddonOnlyDialog'))throw Error('original workflow missing');
 const hook='const ot=T.reduce(';
 part=one(part,hook,'/* PB2070 desktop entry */x.useEffect(()=>{const open=()=>{if(s||W||c||!r||!window.matchMedia("(min-width:821px)").matches)return;r();pb1793SetStandalone(true)};document.addEventListener("pb2070-open-addon",open);return()=>document.removeEventListener("pb2070-open-addon",open)},[s,W,c,r]);'+hook,'composer entry');
 ui=ui.slice(0,start)+part+ui.slice(end);
 const old='e.jsx("button",{className:"photographerContextAction primary",onClick:()=>Le("upload"),children:"＋ چاپ عکس جدید"})';
 const marked=old.replace('photographerContextAction primary','photographerContextAction primary pb2070PrintEntry');
 const help=(kind,title)=>'e.jsxs("button",{type:"button",className:"pb2070DesktopOnly pb2070EntryGuide","data-pb2070-guide":"'+kind+'","aria-label":"ویدیوی آموزشی '+title+'",title:"ویدیوی آموزشی '+title+'",children:[e.jsx("span",{className:"pb2071GuidePlay","aria-hidden":true,children:"▶"}),e.jsx("em",{className:"pb2071GuideLabel",children:"راهنما"})]})';
 const extra='e.jsx("button",{type:"button",className:"photographerContextAction primary pb2070DesktopOnly pb2070AddonEntry",disabled:W,onClick:()=>document.dispatchEvent(new Event("pb2070-open-addon")),children:"سفارش شاسی و قاب بدون چاپ"})';
 const pair=(action,guide,cls)=>'e.jsxs("div",{className:"pb2071EntryPair '+cls+'",children:['+action+','+guide+']})';
 return one(ui,old,'e.jsxs(e.Fragment,{children:['+pair(marked,help('new-print','چاپ عکس جدید'),'pb2071PrimaryPair')+','+pair(extra,help('addon-only','سفارش شاسی و قاب بدون چاپ'),'pb2070DesktopOnly pb2071SecondaryPair')+']})','board actions');
}
function guidePatch(g){
 if(g.includes('/* PB2070 entry guides */'))return g;
 const finance="    {key:'finance-desktop',kind:'finance',device:'desktop',title:'راهنمای مالی (دسکتاپ)',category:'راهنمای مالی · دسکتاپ',description:'آموزش فاکتورها، پرداخت‌ها و حساب معین در ویندوز و دسکتاپ',sortOrder:980}";
 g=one(g,finance,finance+",\n    {key:'new-print-desktop',kind:'new-print',device:'desktop',title:'چاپ عکس جدید (ویندوز)',category:'راهنمای چاپ عکس جدید · دسکتاپ',description:'آموزش ثبت سفارش چاپ عکس جدید',sortOrder:990},\n    {key:'addon-only-desktop',kind:'addon-only',device:'desktop',title:'سفارش شاسی و قاب بدون چاپ (ویندوز)',category:'راهنمای شاسی و قاب بدون چاپ · دسکتاپ',description:'آموزش سفارش مستقل شاسی و قاب بدون چاپ عکس',sortOrder:1000}",'admin slots');
 g=one(g,"finance:'مالی'})[slot.kind]","finance:'مالی','new-print':'چاپ عکس جدید','addon-only':'سفارش شاسی و قاب بدون چاپ'})[slot.kind]",'admin titles');
 const anchor="  window.addEventListener('click',onDelegatedVideoGuideClick,true);";
 const add=[
 "  /* PB2070 entry guides */",
 "  window.addEventListener('click',event=>{",
 "    const button=event.target?.closest?.('button[data-pb2070-guide]');",
 "    if(!button||!button.isConnected||!location.pathname.startsWith('/photographer')||isMobile())return;",
 "    const kind=button.dataset.pb2070Guide;if(!['new-print','addon-only'].includes(kind))return;",
 "    event.preventDefault();event.stopImmediatePropagation();if(button.dataset.pbGuideOpening==='1')return;button.dataset.pbGuideOpening='1';",
 "    void openContextGuide(kind,button).finally(()=>{delete button.dataset.pbGuideOpening});",
 "  },true);",
 "  function pb2070EntryStyle(){",
 "    if(document.getElementById('pb2070EntryStyle'))return;",
 "    const style=document.createElement('style');style.id='pb2070EntryStyle';",
 "    style.textContent='@media(max-width:820px){.pb2070DesktopOnly{display:none!important}.pb2071EntryPair:not(.pb2070DesktopOnly){display:contents!important}}@media(min-width:821px){html body .photographerLabContextActions:has(.pb2070PrintEntry){display:flex!important;align-items:center!important;justify-content:center!important;flex-wrap:wrap!important;gap:10px!important}html body .pb2071EntryPair{display:inline-flex!important;align-items:center!important;flex:0 0 auto!important;direction:rtl!important;gap:0!important;box-sizing:border-box!important;height:36px!important;border:1px solid #cdd9ec!important;border-radius:11px!important;background:#fff!important;color:#24416b!important;overflow:hidden!important}html body .pb2071PrimaryPair{background:#3b82f6!important;border-color:#3b82f6!important;color:#fff!important}html body .pb2071EntryPair>button{box-sizing:border-box!important;position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;height:34px!important;min-height:0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:inherit!important;white-space:nowrap!important;cursor:pointer!important}html body .pb2071EntryPair>button.photographerContextAction{padding:0 12px!important;font-weight:700!important;width:auto!important;min-width:0!important}html body .pb2071EntryPair>button.pb2070EntryGuide{flex-direction:column!important;gap:2px!important;min-width:41px!important;width:41px!important;padding:2px 5px!important;color:#315efb!important}html body .pb2071PrimaryPair>button.pb2070EntryGuide{color:#fff!important}html body .pb2071EntryPair>button.pb2070EntryGuide::before{content:\"\"!important;position:absolute!important;inset-inline-start:0!important;top:6px!important;bottom:6px!important;width:1px!important;background:#cdd9ec!important;pointer-events:none!important}html body .pb2071PrimaryPair>button.pb2070EntryGuide::before{background:rgba(255,255,255,.65)!important}html body .pb2071GuidePlay{display:inline-grid!important;place-items:center!important;width:12px!important;height:12px!important;border-radius:50%!important;background:#315efb!important;color:#fff!important;font:700 7px/1 Tahoma,sans-serif!important}html body .pb2071PrimaryPair .pb2071GuidePlay{background:#fff!important;color:#3b82f6!important}html body .pb2071GuideLabel{display:block!important;font:700 8px/1.15 Vazirmatn,Tahoma,sans-serif!important;color:inherit!important;font-style:normal!important}html body .pb2071EntryPair>button:hover{background:rgba(90,125,190,.10)!important}html body .pb2071PrimaryPair>button:hover{background:rgba(255,255,255,.14)!important}html body .pb2071EntryPair>button:focus-visible{outline:2px solid currentColor!important;outline-offset:-3px!important}html body .pb2071EntryPair>button:disabled{opacity:.5!important;cursor:not-allowed!important}html body .pb1793StandaloneLaunch{display:none!important}}';",
 "    document.head.append(style);",
 "  }"].join('\n');
 g=one(g,anchor,anchor+'\n'+add,'tutorial dispatch');
 return one(g,"function sync(){if(location.pathname==='/guide')return;","function sync(){if(location.pathname==='/guide')return;pb2070EntryStyle();",'style');
}
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>{fs.writeFileSync(p,s);const bytes=fs.readFileSync(p);for(const [ext,encode,decode] of [['.br',zlib.brotliCompressSync,zlib.brotliDecompressSync],['.gz',zlib.gzipSync,zlib.gunzipSync]])if(fs.existsSync(p+ext)){fs.writeFileSync(p+ext,encode(bytes));if(!decode(fs.readFileSync(p+ext)).equals(bytes))throw Error('[R2070] stale compressed '+p+ext)}};
const bundle='dist/web/assets/index-UIRefine-v655-r84.js',guide='dist/web/photobridge-workflow-guides-v572.js';
const ui=bundlePatch(read(bundle)),js=guidePatch(read(guide));new Function(js);write(bundle,ui);write(guide,js);execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
const htmlFile='dist/web/index.html';let html=read(htmlFile);
for(const asset of ['index-UIRefine-v655-r84.js','photobridge-workflow-guides-v572.js']){
 const re=new RegExp(asset.replaceAll('.','[.]')+'\\?[^"\\x27<>\\s]+','g');const matches=[...html.matchAll(re)];if(matches.length!==1)throw Error('[R2070] asset URL '+asset+' '+matches.length);
 html=html.replace(re,url=>url.includes('desktopEntry=r2071')?url:asset.startsWith('index-')&&url.includes('&albumSizes=')?url.replace('&albumSizes=','&desktopEntry=r2071&albumSizes='):url+'&desktopEntry=r2071');
}write(htmlFile,html);
console.log('[R2070] desktop order board and two independent video slots');
