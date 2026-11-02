import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('function Kv('),end=source.indexOf('function ',start+12);
if(start<0||end<=start)throw Error('R1539 photographer album editor missing');
let ui=source.slice(start,end);
function once(a,b,label){if(ui.split(a).length!==2)throw Error('R1539 album UI '+label+' changed');ui=ui.replace(a,b)}
once('const[l,c]=x.useState(null),[m,g]=','const[l,c]=x.useState(null),[pb1539Binding,pb1539SetBinding]=x.useState("album_binding_price"),[m,g]=','model state');
once('const gt=$e.settings||{};c(gt),','const gt=$e.settings||{};c(gt),pb1539SetBinding("album_binding_price"),','reset when switching labs');
once('ue=()=>({sizeId:m,','ue=()=>({bindingTypeId:pb1539Binding,sizeId:m,','draft identity');
once('ht.sizeId&&g(String(ht.sizeId)),','ht.bindingTypeId&&pb1539SetBinding(String(ht.bindingTypeId)),ht.sizeId&&g(String(ht.sizeId)),','resume selected model');
once('const b=JSON.stringify({sizeId:m,','const b=JSON.stringify({bindingTypeId:pb1539Binding,sizeId:m,','draft save dependency');
once('albumData:{sizeId:Q?','albumData:{bindingTypeId:pb1539Binding,sizeId:Q?','order payload');
const anchor=':ge,bt=Be?R:[]';
const snippet=[
':ge,',
"pb1539Catalog=l.printTariffCatalog||{types:[{id:'album_binding_price',kind:'binding',name:'صحافی آلبوم'}],rates:{}},",
"pb1539Bindings=(pb1539Catalog.types||[]).filter($e=>$e.kind==='binding'&&$e.active!==false),",
"pb1539Chosen=pb1539Bindings.find($e=>String($e.id)===pb1539Binding)||pb1539Bindings[0]||{id:'album_binding_price',name:'صحافی آلبوم'},",
"pb1539PriceOf=($e,id=pb1539Chosen.id)=>id==='album_binding_price'?Number($e.bindingPrice||0):Number(pb1539Catalog.rates?.[String($e.printSizeId||'')]?.[id]||0),",
"pb1539Sizes=(l.sizes||[]).filter($e=>pb1539PriceOf($e)>0),",
"pb1539Price=Q?null:Be?pb1539PriceOf(Be):null,",
'bt=Be?R:[]'
].join('');
once(anchor,snippet,'binding types and price by size');
once('si=Q?0:Number((Be==null?void 0:Be.bindingPrice)||0),','si=Q?0:Number(pb1539Price||0),','quote binding amount');
{
 const first=ui.indexOf('ja=!!('),last=first<0?-1:ui.indexOf(',Va=',first);
 if(first<0||last<=first||last-first>300)throw Error('R1539 pending quote boundary changed');
 const previous=ui.slice(first+3,last);
 ui=ui.slice(0,first)+'ja=Boolean(('+previous+')||(!Q&&(!pb1539Price||!pb1539Sizes.some($e=>String($e.id)===String(m)))))'+ui.slice(last);
}
const form='e.jsxs("div",{className:"grid2 albumCoreFields",children:[e.jsxs("label",{children:["سایز آلبوم"';
const chosen='e.jsxs("div",{className:"grid2 albumCoreFields",children:[e.jsxs("label",{className:"pb1539BindingField",children:["نوع صحافی",e.jsx("select",{value:String(pb1539Chosen.id),disabled:je||!!he.current,onChange:$e=>{const id=String($e.target.value);pb1539SetBinding(id);const first=(l.sizes||[]).find(gt=>pb1539PriceOf(gt,id)>0);if(first&&String(first.id)!==String(m))Wa(String(first.id));if(!first){g("");J("")}},children:pb1539Bindings.map($e=>e.jsx("option",{value:String($e.id),children:$e.name},$e.id))})]}),e.jsxs("label",{children:["سایز آلبوم"';
once(form,chosen,'binding before album size');
once('options:[...(l.sizes||[]).map($e=>({value:String($e.id),label:$e.label})),{value:"__custom__",label:"سایز آزاد / دلخواه"}]',
 'options:[...pb1539Sizes.map($e=>({value:String($e.id),label:$e.label+" · صحافی "+V(pb1539PriceOf($e))+" تومان"})),{value:"__custom__",label:"سایز آزاد / دلخواه"}]','filtered size options');
once('if(!Be)return alert(Q?"ابعاد سایز آزاد آلبوم را وارد کن.":"سایز آلبوم را انتخاب کن.");',
 'if(!pb1539Bindings.some(gt=>String(gt.id)===String(pb1539Binding)))return alert("ابتدا نوع صحافی را انتخاب کن.");if(!Be||(!Q&&!pb1539Sizes.some(gt=>String(gt.id)===String(m))))return alert(Q?"ابعاد سایز آزاد آلبوم را وارد کن.":"برای این مدل صحافی، یک سایز دارای تعرفه انتخاب کن.");','validate binding priced size');
source=source.slice(0,start)+ui+source.slice(end)+'\n/* PB1539 photographer album binding per-size selector */\n';
fs.writeFileSync(file,source);
const htmlPath='dist/web/index.html';
let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&albumBinding=r1539')?u:u+'&albumBinding=r1539');
fs.writeFileSync(htmlPath,html);
