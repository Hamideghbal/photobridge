import fs from 'node:fs';
const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1418 anchor '+n+': '+a.slice(0,90));return s.replace(a,b)};
const p='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(p,'utf8');
if(!ui.includes('/* PB1418 lab finance presentation */')){
 const start=ui.indexOf('function ub({role:t,'),end=ui.indexOf('function ',start+15);
 if(start<0||end<start)throw Error('R1418 finance component missing');
 let part=ui.slice(start,end);
 part=once(part,'const[r,o]=x.useState([])','const[pb1418DateOrder,pb1418SetDateOrder]=x.useState("desc"),[r,o]=x.useState([])');
 part=once(part,'st=(_==null?void 0:_.rows)||[]','st=t==="lab"?PB1418SortStatementRows((_==null?void 0:_.rows)||[],pb1418DateOrder):(_==null?void 0:_.rows)||[]');
 part=once(part,'e.jsxs("button",{className:"financeHelpButton"','(t!=="lab"||w!=="overview")&&e.jsxs("button",{className:"financeHelpButton"');
 const table='e.jsx("th",{children:"ردیف"}),e.jsx("th",{children:"تاریخ"}),e.jsx("th",{children:"شرح"})';
 part=once(part,table,'e.jsx("th",{children:"ردیف"}),e.jsx("th",{"aria-sort":t==="lab"?(pb1418DateOrder==="desc"?"descending":"ascending"):void 0,children:t==="lab"?e.jsx("button",{type:"button",className:"pb1418DateSort",onClick:()=>{pb1418SetDateOrder(v=>v==="desc"?"asc":"desc");Re(1)},"aria-label":pb1418DateOrder==="desc"?"تاریخ؛ جدیدترین ابتدا. نمایش قدیمی‌ترین ابتدا":"تاریخ؛ قدیمی‌ترین ابتدا. نمایش جدیدترین ابتدا",children:pb1418DateOrder==="desc"?"تاریخ ↓":"تاریخ ↑"}):"تاریخ"}),e.jsx("th",{children:"شرح"})');
 const openingStart=part.indexOf('Y===1&&Number(_.opening)!==0&&');
 const openingEnd=part.indexOf(',Pt.map((Je,Ot)',openingStart);
 if(openingStart<0||openingEnd<openingStart)throw Error('R1418 opening row missing');
 const opening=part.slice(openingStart,openingEnd);
 part=part.slice(0,openingStart)+opening.replace('Y===1&&','(t!=="lab"||pb1418DateOrder==="asc")&&Y===1&&')+part.slice(openingEnd);
 part=once(part,',!st.length&&e.jsx("tr"',',t==="lab"&&pb1418DateOrder==="desc"&&'+opening.replace('Y===1&&','Y===dt&&')+',!st.length&&e.jsx("tr"');
 part=once(part,'Re(Ot?kn:1)','Re(t==="lab"?1:Ot?kn:1)');
 const helper='function PB1418SortStatementRows(rows,direction){const sign=direction==="asc"?1:-1;return rows.map((row,index)=>({row,index})).sort((a,b)=>{const av=Date.parse(a.row.txn_date),bv=Date.parse(b.row.txn_date);const delta=(Number.isFinite(av)?av:0)-(Number.isFinite(bv)?bv:0);return sign*(delta||a.index-b.index)}).map(item=>item.row)}\n';
 ui=ui.slice(0,start)+helper+part+ui.slice(end)+'\n/* PB1418 lab finance presentation */\n';
 fs.writeFileSync(p,ui);
}
const manual='dist/web/photobridge-r1176-lab-finance.js';let m=fs.readFileSync(manual,'utf8');
if(!m.includes('PB1418FormatMoneyInput')){
 m=once(m,'function manual({api,customers=[],refresh}){','function PB1418FormatMoneyInput(input){const end=input.selectionStart??input.value.length,count=digits(input.value.slice(0,end)).length,raw=digits(input.value);input.value=raw?BigInt(raw).toLocaleString("fa-IR"):"";let pos=0,seen=0;while(pos<input.value.length&&seen<count){if(/[۰-۹0-9]/.test(input.value[pos]))seen++;pos++}input.setSelectionRange?.(pos,pos)}\nfunction manual({api,customers=[],refresh}){');
 m=once(m,'count.oninput=price.oninput=refreshTotal;','count.oninput=refreshTotal;price.oninput=()=>{PB1418FormatMoneyInput(price);refreshTotal()};');
 fs.writeFileSync(manual,m);
}
const header='dist/web/photobridge-r1372-third-header.js';let h=fs.readFileSync(header,'utf8');
if(!h.includes('pb1418ManualInvoiceAction')){
 h=once(h,"root.querySelectorAll('.financeSectionTools>button')","root.querySelectorAll('.financeSectionTools>button,.pb1176ManualOpen')");
 h=once(h,"button.disabled=original.disabled;","button.classList.toggle('pb1418ManualInvoiceAction',original.classList.contains('pb1176ManualOpen'));button.disabled=original.disabled;");
 fs.writeFileSync(header,h);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1418-finance.css'))html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1418-finance.css?v=r1418"></head>');
for(const name of ['photobridge-r1176-lab-finance.js','photobridge-r1372-third-header.js','assets/index-UIRefine-v655-r84.js']){
 const escaped=name.replaceAll('.','\\.');
 html=html.replace(new RegExp('('+escaped+'\\?[^"\x27]*)','g'),link=>link.includes('&financePolish=')?link:link+'&financePolish=r1418');
}
fs.writeFileSync('dist/web/index.html',html);
