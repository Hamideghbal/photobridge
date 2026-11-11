/* R1777: separate per-model walk-in prices from colleague tariff. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';
let server=fs.readFileSync(file,'utf8');
function patchWalkin(input){
 const an="import {handleLabPrintCatalog,normalizePrintCatalog,applyPrintRates} from './lab-print-catalog.js';";
 const replace=an.replace("applyPrintRates}","applyPrintRates,applyWalkinPrintRates}");
 if(input.split(an).length!==2)throw Error("catalog import wrong");input=input.replace(an,replace);
 const start=input.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/walkin/prices') {");
 const end=input.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/prices') {",start+10);
 if(start<0||end<=start)throw Error("walkin segment bounds");
 let sec=input.slice(start,end);
 function one(a,b){if(sec.split(a).length!==2)throw Error("walkin anchor count "+(sec.split(a).length-1));sec=sec.replace(a,b)}
 one("                await c.query('BEGIN');","                await c.query('BEGIN');\n                const sizeIds=rows.map(r=>String(r.sizeId||'')).filter(Boolean);\n                let pb1777Catalog=null;\n                if(rows.some(r=>Object.hasOwn(r,'customRates'))){\n                    const prefs=await c.query('SELECT ui_preferences FROM labs WHERE id=$1 FOR UPDATE',[labId]);\n                    pb1777Catalog=applyWalkinPrintRates(normalizePrintCatalog(prefs.rows[0]?.ui_preferences?.printTariffCatalog),rows,sizeIds);\n                }");
 one("                await c.query('COMMIT');","                if(pb1777Catalog)await c.query(\"UPDATE labs SET ui_preferences=jsonb_set(COALESCE(ui_preferences,'{}'::jsonb),'{printTariffCatalog}',$2::jsonb,true),updated_at=now() WHERE id=$1\",[labId,JSON.stringify(pb1777Catalog)]);\n                await c.query('COMMIT');");
 input=input.slice(0,start)+sec+input.slice(end);
 return input;
}
server=patchWalkin(server);
fs.writeFileSync(file,server);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1777] walk-in model prices stored separately from colleague prices');

function addUi(src){
const once=(s,a,b,name)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1777] '+name+': '+n);return s.replace(a,b)};
let a=src.indexOf('function tw({data:t,onSaved:a,labName:s=""}){'),b=src.indexOf('function Na(t)',a);if(a<0||b<=a)throw Error('lab pricing component missing');
let c=src.slice(a,b);
c=once(c,'[p,f]=x.useState(!1);x.useEffect','[p,f]=x.useState(!1),[pb1777Edit,pb1777SetEdit]=x.useState(null);x.useEffect','lab model state');
const button='e.jsx("button",{className:"pbActionButton secondary",type:"button",onClick:()=>pb1539Create(),children:"+ مدل صحافی جدید"}),';
c=once(c,button,button+'e.jsx("button",{className:"pbActionButton secondary",onClick:()=>pb1539Create("chassis"),children:"+ شاسی جدید"}),e.jsx("button",{className:"pbActionButton secondary",onClick:()=>pb1539Create("frame"),children:"+ قاب جدید"}),','lab add buttons');
const edit='k.startsWith("pb1539_")&&e.jsx("button",{type:"button",className:"pb1540BindingDelete"';
c=once(c,edit,'k.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===k.slice(7))?.kind==="frame"&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1539Types.find(t=>t.id===k.slice(7))),children:"عکس و رنگ"}),'+edit,'lab frame header');
const editMobile='C.startsWith("pb1539_")&&e.jsx("button",{type:"button",className:"pb1540BindingDelete"';
c=once(c,editMobile,'C.startsWith("pb1539_")&&pb1539Types.find(t=>t.id===C.slice(7))?.kind==="frame"&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1539Types.find(t=>t.id===C.slice(7))),children:"عکس و رنگ"}),'+editMobile,'lab mobile photo');
const tail='m!==void 0&&e.jsx(wb,{size:m,onClose:()=>g(void 0),onSaved:S,showTariffs:!0})';
c=once(c,tail,tail+',pb1777Edit&&e.jsx(PB1777FrameModelEditor,{model:pb1777Edit,onClose:()=>pb1777SetEdit(null),onSaved:pb1539Reload})','lab editor render');
src=src.slice(0,a)+c+src.slice(b);
// Walk-in models share the same lab catalogue but prices use an independent rate matrix.
a=src.indexOf('function Qj(){');b=src.indexOf('function Zj(',a);if(a<0||b<=a)throw Error('walk-in tariffs missing');c=src.slice(a,b);
c=once(c,'[c,m]=x.useState(void 0),g=()=>Me("/api/lab/walkin").then(I=>{a(I),r((I.prices||[]).map(T=>({...T})))});','[c,m]=x.useState(void 0),[pb1777Catalog,pb1777SetCatalog]=x.useState({types:[],walkinRates:{}}),[pb1777Edit,pb1777SetEdit]=x.useState(null),g=()=>Promise.all([Me("/api/lab/walkin"),Me("/api/lab/print-catalog")]).then(([I,K])=>{a(I),r((I.prices||[]).map(T=>({...T}))),pb1777SetCatalog(K.catalog||{types:[],walkinRates:{}})});','walkin fetch');
c=once(c,'const p=(I,T,k)=>','const pb1777Models=(pb1777Catalog.types||[]).filter(v=>!v.legacy&&v.active!==false&&["chassis","frame"].includes(v.kind)),pb1777Fields=[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"],["chassis","قیمت شاسی"],...pb1777Models.filter(v=>v.kind==="chassis").map(v=>["pb1539_"+v.id,v.name]),["frame","قیمت قاب"],...pb1777Models.filter(v=>v.kind==="frame").map(v=>["pb1539_"+v.id,v.name])],pb1777Value=(row,key)=>key.startsWith("pb1539_")?(Object.hasOwn(row,key)?row[key]:pb1777Catalog.walkinRates?.[row.id]?.[key.slice(7)]):row[key],pb1777Create=async kind=>{const name=prompt("نام مدل "+(kind==="frame"?"قاب":"شاسی")+":");if(!name?.trim())return;await Me("/api/lab/print-catalog",{method:"POST",body:JSON.stringify({kind,name:name.trim()})});await g()},p=(I,T,k)=>','walkin fields');
c=once(c,'frame:Na(I.frame)}))})','frame:Na(I.frame),customRates:Object.fromEntries(pb1777Models.map(v=>[v.id,Na(pb1777Value(I,"pb1539_"+v.id))]))}))})','walkin save');
c=once(c,'k=[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"],["chassis","قیمت شاسی"],["frame","قیمت قاب"]]','k=pb1777Fields','walkin print');
const add='e.jsx("button",{className:"pbActionButton secondary",onClick:()=>m(null),children:"+ سایز جدید"}),';
c=once(c,add,add+'e.jsx("button",{className:"pbActionButton secondary",onClick:()=>pb1777Create("chassis"),children:"+ شاسی جدید"}),e.jsx("button",{className:"pbActionButton secondary",onClick:()=>pb1777Create("frame"),children:"+ قاب جدید"}),','walkin add buttons');
const headers='className:"priceGrid walkinUnifiedPriceGrid head",children:[e.jsx("b",{children:"سایز"}),e.jsx("b",{children:"لاستر"}),e.jsx("b",{children:"سیلک"}),e.jsx("b",{children:"متالیک"}),e.jsx("b",{children:"قیمت شاسی"}),e.jsx("b",{children:"قیمت قاب"})]';
c=once(c,headers,'className:"priceGrid walkinUnifiedPriceGrid head",style:{gridTemplateColumns:"minmax(140px,1.5fr) repeat("+pb1777Fields.length+",minmax(110px,1fr))"},children:[e.jsx("b",{children:"سایز"}),pb1777Fields.map(([k,label])=>e.jsxs("b",{children:[label,k.startsWith("pb1539_")&&pb1777Models.find(v=>v.id===k.slice(7))?.kind==="frame"&&e.jsx("button",{type:"button",className:"pb1777FrameEditLaunch",onClick:()=>pb1777SetEdit(pb1777Models.find(v=>v.id===k.slice(7))),children:"عکس و رنگ"})]},k))]','walkin headers');
c=once(c,'className:"priceGrid walkinUnifiedPriceGrid",children:','className:"priceGrid walkinUnifiedPriceGrid",style:{gridTemplateColumns:"minmax(140px,1.5fr) repeat("+pb1777Fields.length+",minmax(110px,1fr))"},children:','walkin grid');
c=once(c,'[["luster","لاستر"],["silk","سیلک"],["metallic","متالیک"],["chassis","قیمت شاسی"],["frame","قیمت قاب"]].map(([k,E])=>','pb1777Fields.map(([k,E])=>','walkin cells');
c=once(c,'value:Bn(I[k]),onChange:','value:Bn(pb1777Value(I,k)),onChange:','walkin cell value');
c=once(c,'c!==void 0&&e.jsx(wb,{size:c,onClose:()=>m(void 0),onSaved:g})','c!==void 0&&e.jsx(wb,{size:c,onClose:()=>m(void 0),onSaved:g}),pb1777Edit&&e.jsx(PB1777FrameModelEditor,{model:pb1777Edit,onClose:()=>pb1777SetEdit(null),onSaved:g})','walkin modal');
return src.slice(0,a)+c+src.slice(b);
}
const uiPath='dist/web/assets/index-UIRefine-v655-r84.js';
fs.writeFileSync(uiPath,addUi(fs.readFileSync(uiPath,'utf8'))+'\n'+fs.readFileSync('scripts/r1777-frame-model-editor.js.txt','utf8'));
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1777-frame-color-picker.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1777-frame-color-picker.css?v=r1777"></head>');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,v=>v.includes('&frameModel=r1777')?v:v+'&frameModel=r1777');
fs.writeFileSync('dist/web/index.html',html);
execFileSync(process.execPath,['--check',uiPath],{stdio:'inherit'});
