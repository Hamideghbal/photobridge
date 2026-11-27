'use strict';
function pb2063FirstIndex(rows,key){const result=new Map();for(const row of rows){const id=row[key];if(!result.has(id))result.set(id,row)}return result}
function pb2063TablePage(customers,query,page,size=50){
 const q=String(query||"").trim().toLocaleLowerCase();
 const all=q?customers.filter(c=>[c.name,c.mobile,c.id,c.folder_latin_name].some(v=>String(v??"").toLocaleLowerCase().includes(q))):customers;
 const pages=Math.max(1,Math.ceil(all.length/size)),active=Math.max(1,Math.min(page,pages));
 return{rows:all.slice((active-1)*size,active*size),pages,active,total:all.length};
}
function patchIntake(source){
 if(source.includes("/* PB2063 linear native intake matching */"))return source;
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error("R2063 intake anchor "+a.slice(0,100));return s.replace(a,()=>b)};
 const begin=source.indexOf("async function appendFiles("),end=source.indexOf("function renderGroups(",begin);
 if(begin<0||end<0)throw Error("R2063 append files");
 let section=source.slice(begin,end);
 section=once(section,"const additions=[];","const additions=[],pb2063ByHash=pb2063FirstIndex(group.items,'hash');");
 // Preserve the final R1501 payload (sourceFile/sourceAction and any later
 // metadata). Replace only the lookup and update the index after the old push.
 // Accept verified legacy and newer source shapes, including a predicate
 // which excludes existing-item references and formatting differences.
 const lookup=/(?:const|let)\s+item\s*=\s*group\.items\.find\([^;]+?\)\s*\|\|\s*additions\.find\([^;]+?\)\s*;(?=[\s\S]*?additions\.push)/g;
 const hits=[...section.matchAll(lookup)];
 if(hits.length!==1||!hits[0][0].includes('hash')||!/\.find\([^;]*?\.hash\s*===\s*hash/.test(hits[0][0]))throw Error("R2063 intake hash lookup: "+section.slice(0,1400));
 section=section.replace(lookup,"const item=pb2063ByHash.get(hash);");
 const newItem=/else additions\.push\(\{file,hash,size,paper,copies:1[^}]*\}\);/g;
 if([...section.matchAll(newItem)].length!==1)throw Error("R2063 new item payload changed");
 section=section.replace(newItem,match=>"else{"+match.slice(5)+"pb2063ByHash.set(hash,additions[additions.length-1]);}");
 const hashStage="pb1569Hashes=await pb1569MapLimit(pb1569Files,3,pb1569Digest)";
 if(section.includes(hashStage)){
  section=once(section,hashStage,"pb1569Hashes=await pb1569MapLimit(pb1569Files,3,async file=>{const hash=await pb1569Digest(file);error.textContent='در حال بررسی عکس‌ها: '+(++pb2063Hashed)+' / '+pb1569Files.length;return hash})");
  section=once(section,"const additions=[],","let pb2063Hashed=0;const additions=[],");
 }
 source=source.slice(0,begin)+section+source.slice(end);
 source=once(source,"for(const item of entries){const file=detail.files.find(f=>f.id===item.fileId);","const pb2063FilesById=pb2063FirstIndex(detail.files,'id');for(const item of entries){const file=pb2063FilesById.get(item.fileId);");
 source=once(source,"const storage=()=>window.pbLabLocalIntakeStorage;",pb2063FirstIndex.toString()+"\nconst storage=()=>window.pbLabLocalIntakeStorage;");
 return source+"\n/* PB2063 linear native intake matching */\n";
}
function patchTable(source){
 if(source.includes("/* PB2063 bounded native photographer rows */"))return source;
 const prefix="function PB1585PhotographersTable({customers,onSaved}){";
 if(source.split(prefix).length!==2)throw Error("R2063 photographer table");
 const start=source.indexOf(prefix),mapStart=source.indexOf("children:customers.map(customer=>",start);
 if(mapStart<0||mapStart-start>12000)throw Error("R2063 photographer row anchor");
 const header="e.jsx('thead',{children:e.jsx('tr',{children:";
 const hi=source.indexOf(header,start),tbody=source.indexOf("e.jsx('tbody',",hi);
 if(hi<0||hi>mapStart||tbody<0||tbody>mapStart)throw Error("R2063 photographer header");
 const oldHeader=source.slice(hi,tbody),end=oldHeader.lastIndexOf("})}),");
 if(end<0)throw Error("R2063 photographer header end");
 const control="e.jsx('tr',{children:e.jsx('th',{colSpan:6,children:e.jsxs('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'},children:[e.jsx('input',{type:'search',value:pb2063Search,placeholder:'جستجوی عکاسی…','aria-label':'جستجوی همه عکاسی‌ها',onChange:event=>{pb2063SetSearch(event.target.value);pb2063SetPage(1)}}),e.jsx('button',{type:'button',disabled:pb2063Table.active<=1,onClick:()=>pb2063SetPage(pb2063Table.active-1),children:'قبلی'}),e.jsx('span',{children:pb2063Table.active+' / '+pb2063Table.pages+' · '+pb2063Table.total}),e.jsx('button',{type:'button',disabled:pb2063Table.active>=pb2063Table.pages,onClick:()=>pb2063SetPage(pb2063Table.active+1),children:'بعدی'})]})})}),";
 const head="e.jsxs('thead',{children:["+control+"e.jsx('tr',{children:"+oldHeader.slice(header.length,end)+"})]}),"+oldHeader.slice(end+5);
 const decl=prefix+"\n const [pb2063Search,pb2063SetSearch]=x.useState(''),[pb2063Page,pb2063SetPage]=x.useState(1);const pb2063Table=x.useMemo(()=>pb2063TablePage(customers,pb2063Search,pb2063Page),[customers,pb2063Search,pb2063Page]);";
 return source.slice(0,start)+decl+source.slice(start+prefix.length,hi)+head+source.slice(tbody,mapStart)+"children:pb2063Table.rows.map(customer=>"+source.slice(mapStart+"children:customers.map(customer=>".length)+"\n"+pb2063TablePage.toString()+"\n/* PB2063 bounded native photographer rows */\n";
}


function once(v,a,b,label){if(v.split(a).length!==2)throw Error('PB165 '+label+' '+a.slice(0,90));return v.replace(a,()=>b);}
function pb2050CustomerPicker({value,customers,onChange,statement=false,prompt=false}){
 const options=x.useMemo(()=>[{value:'',label:statement?'انتخاب عکاسی':'همهٔ عکاسی‌ها'},...customers.map(row=>({value:String(row.id),label:row.name||row.mobile||'عکاسی'}))],[customers,statement]);
 return e.jsx('div',{className:(statement?'pb1421CustomerSelect':'pb1427InvoiceCustomerSelect')+' pb2051PickerFrame'+(prompt?' pb2056PromptPicker':''),children:e.jsx(wn,{value,options,searchable:true,searchPlaceholder:'جستجوی عکاسی…',ariaLabel:'انتخاب عکاسی',className:'pb2050CustomerPicker',menuClassName:'pb891FinanceSelectMenu pb2050CustomerMenu',onChange})});
}

function pb165PageControls({table,query,setQuery,setPage}){return e.jsxs('div',{className:'pb165PageControls',children:[e.jsx('input',{type:'search',value:query,placeholder:'جستجوی عکاسی…',onChange:event=>{setQuery(event.target.value);setPage(1)}}),e.jsx('button',{type:'button',disabled:table.active<=1,onClick:()=>setPage(table.active-1),children:'قبلی'}),e.jsx('span',{children:table.active+' / '+table.pages+' · '+table.total}),e.jsx('button',{type:'button',disabled:table.active>=table.pages,onClick:()=>setPage(table.active+1),children:'بعدی'})]});}
function patchRenderer(s){
 if(s.includes('/* PB165 native performance */'))return s;
  // The old searchable selector explicitly refocused its input after choosing
 // an option. onFocus reopened the menu. Avoid that only in finance pickers.
 if(!s.includes('pb2063Options=x.useMemo')&&!s.includes('[pb2050Limit,pb2050SetLimit]')){
 const sa=s.indexOf('function wn('),sb=s.indexOf('}function ql(',sa);if(sa<0||sb<sa)throw Error('[R2050] select region');
 let select=s.slice(sa,sb+1);
 select=once(select,"I=(s||[]).find(n=>String(n.value)===String(t)),P=String(Q||\"\").trim().toLocaleLowerCase(\"fa-IR\"),G=p&&P?(s||[]).filter(n=>String((n==null?void 0:n.label)||\"\").toLocaleLowerCase(\"fa-IR\").includes(P)):(s||[])","pb2063Indexed=l.includes(\"pb2050CustomerPicker\"),pb2063Options=x.useMemo(()=>{if(!pb2063Indexed)return null;const values=new Map(),entries=(s||[]).map(n=>{const key=String(n.value);if(!values.has(key))values.set(key,n);return {option:n,key:String(n.label||\"\").toLocaleLowerCase(\"fa-IR\")}});return{values,entries}},[s,pb2063Indexed]),I=pb2063Options?pb2063Options.values.get(String(t)):(s||[]).find(n=>String(n.value)===String(t)),P=String(Q||\"\").trim().toLocaleLowerCase(\"fa-IR\"),pb2063Matches=x.useMemo(()=>pb2063Options&&p&&P?pb2063Options.entries.filter(n=>n.key.includes(P)).map(n=>n.option):null,[p,P,pb2063Options]),G=p&&P?(pb2063Options?pb2063Matches:(s||[]).filter(n=>String((n==null?void 0:n.label)||\"\").toLocaleLowerCase(\"fa-IR\").includes(P))):(s||[])",'indexed finance search');
 select=once(select,'U(!1),Z(""),setTimeout(()=>{try{N.current','U(!1),Z(""),(l.includes("pb2050CustomerPicker")||l.includes("pb891SearchableCustomerSelect")||l.includes("pb1427InvoiceCustomerSelect"))?N.current?.blur():setTimeout(()=>{try{N.current','finance selection does not refocus and reopen');
 // Render a bounded first page for large finance customer lists. Scrolling
 // or searching still reaches every option; no artificial customer cap.
 select=once(select,'[O,U]=x.useState(!1),[Q,Z]=x.useState("")','[O,U]=x.useState(!1),[Q,Z]=x.useState(""),[pb2050Limit,pb2050SetLimit]=x.useState(32)','select page state');
 select=once(select,'x.useEffect(()=>{o&&(U(!1),Z(""))},[o]);','x.useEffect(()=>{o&&(U(!1),Z(""))},[o]);x.useEffect(()=>{if(l.includes("pb2050CustomerPicker"))pb2050SetLimit(32)},[O,Q]);','reset visible options');
 select=once(select,'style:Y,role:"listbox",dir:"rtl",children:G.length?G.map(','style:Y,role:"listbox",dir:"rtl",onScroll:event=>{const node=event.currentTarget;if(l.includes("pb2050CustomerPicker")&&node.scrollTop+node.clientHeight>=node.scrollHeight-64&&pb2050Limit<G.length)pb2050SetLimit(limit=>Math.min(G.length,limit+32))},children:G.length?(l.includes("pb2050CustomerPicker")?G.slice(0,pb2050Limit):G).map(','incremental finance options');
 s=s.slice(0,sa)+select+s.slice(sb+1);

 }else if(!s.includes('pb2063Options=x.useMemo')){const sa=s.indexOf('function wn('),sb=s.indexOf('}function ql(',sa);let select=s.slice(sa,sb+1);
 select=once(select,"I=(s||[]).find(n=>String(n.value)===String(t)),P=String(Q||\"\").trim().toLocaleLowerCase(\"fa-IR\"),G=p&&P?(s||[]).filter(n=>String((n==null?void 0:n.label)||\"\").toLocaleLowerCase(\"fa-IR\").includes(P)):(s||[])","pb2063Indexed=l.includes(\"pb2050CustomerPicker\"),pb2063Options=x.useMemo(()=>{if(!pb2063Indexed)return null;const values=new Map(),entries=(s||[]).map(n=>{const key=String(n.value);if(!values.has(key))values.set(key,n);return {option:n,key:String(n.label||\"\").toLocaleLowerCase(\"fa-IR\")}});return{values,entries}},[s,pb2063Indexed]),I=pb2063Options?pb2063Options.values.get(String(t)):(s||[]).find(n=>String(n.value)===String(t)),P=String(Q||\"\").trim().toLocaleLowerCase(\"fa-IR\"),pb2063Matches=x.useMemo(()=>pb2063Options&&p&&P?pb2063Options.entries.filter(n=>n.key.includes(P)).map(n=>n.option):null,[p,P,pb2063Options]),G=p&&P?(pb2063Options?pb2063Matches:(s||[]).filter(n=>String((n==null?void 0:n.label)||\"\").toLocaleLowerCase(\"fa-IR\").includes(P))):(s||[])",'indexed finance search');
 select=select.replaceAll('pb2050SetLimit(120)','pb2050SetLimit(32)').replaceAll('limit+120','limit+32').replace('[pb2050Limit,pb2050SetLimit]=x.useState(120)','[pb2050Limit,pb2050SetLimit]=x.useState(32)');s=s.slice(0,sa)+select+s.slice(sb+1);}

 // Use the existing finance picker component if the server supplied it.
 const oldPicker=s.includes('function pb2050CustomerPicker(');
  const old='e.jsxs("select",{className:"pb1427InvoiceCustomerSelect","aria-label":"انتخاب عکاسی",value:pb1427InvoiceCustomer,onChange:Je=>{pb1427SetInvoiceCustomer(Je.target.value);Ie(1)},children:[e.jsx("option",{value:"",children:"همهٔ عکاسی‌ها"}),E.map(Je=>e.jsx("option",{value:String(Je.id),children:Je.name||Je.mobile||"عکاسی"},Je.id))]})';
 // R1427's native select may be further customized; preserve an unknown
 // variant rather than failing the full build. All known versions still get
 // formatter, memoization and non-blocking feedback improvements.
 if(s.includes(old))s=once(s,old,'e.jsx(pb2050CustomerPicker,{value:pb1427InvoiceCustomer,customers:E,onChange:Je=>{pb1427SetInvoiceCustomer(Je);Ie(1)}})','invoice photographer picker');
 const statementOld='e.jsxs("select",{className:"pb1421CustomerSelect",value:z,"aria-label":"انتخاب عکاسی",onChange:Je=>{q(Je.target.value);A(null);Re(1)},children:[e.jsx("option",{value:"",children:"انتخاب عکاسی"}),...E.map(Je=>e.jsx("option",{value:String(Je.id),children:String(Je.name||"عکاسی")},Je.id))]})';
 if(s.includes(statementOld))s=once(s,statementOld,'e.jsx(pb2050CustomerPicker,{statement:true,value:z,customers:E,onChange:Je=>{q(Je);A(null);Re(1)}})','statement photographer picker');
 const receiptOld="e.jsx(\"select\",{value:pb1420PaymentCustomer,onChange:Je=>{pb1420SetPaymentCustomer(Je.target.value);q(Je.target.value)},children:[e.jsx(\"option\",{value:\"\",children:\"همهٔ عکاسی‌ها\"}),...E.map(Je=>e.jsx(\"option\",{value:String(Je.id),children:String(Je.name||\"عکاسی\")},Je.id))]})";
 if(s.includes(receiptOld))s=once(s,receiptOld,'e.jsx(pb2050CustomerPicker,{value:pb1420PaymentCustomer,customers:E,onChange:Je=>{pb1420SetPaymentCustomer(Je);q(Je)}})','receipt photographer picker');

 const promptOld="e.jsx('select',{'aria-label':'انتخاب عکاسی برای ثبت',value:id,onChange:event=>setId(event.target.value),children:[e.jsx('option',{value:'',children:'انتخاب عکاسی'}),...(customers||[]).map(customer=>e.jsx('option',{value:String(customer.id),children:customer.name||customer.mobile||'عکاسی'},customer.id))]})";
 if(s.includes(promptOld))s=once(s,promptOld,"e.jsx(pb2050CustomerPicker,{statement:true,prompt:true,value:id,customers:customers||[],onChange:setId})",'prompt');
 if(!oldPicker)s+='\n'+pb2050CustomerPicker.toString();
 if(s.includes('function PB1585PhotographersTable('))s=patchTable(s);
 else{
 const anchor='function Kj({d:t,collaborationVersion:a=0,onCreate:s,onInvite:r,onSaved:o}){var f;',rows='children:t.customers.length===0?e.jsx(zn,{text:"هنوز عکاسی عضو نشده است."}):t.customers.map(h=>';
 if(s.includes(anchor)&&s.includes(rows)){
 s=once(s,anchor,anchor+'const [pb165Search,pb165SetSearch]=x.useState(""),[pb165Page,pb165SetPage]=x.useState(1);const pb165Table=x.useMemo(()=>pb2063TablePage(t.customers,pb165Search,pb165Page),[t.customers,pb165Search,pb165Page]);','card page state');
 s=once(s,'e.jsx("div",{className:"labPhotographerList",'+rows,'e.jsx(pb165PageControls,{table:pb165Table,query:pb165Search,setQuery:pb165SetSearch,setPage:pb165SetPage}),e.jsx("div",{className:"labPhotographerList",children:pb165Table.total===0?e.jsx(zn,{text:"عکاسی یافت نشد."}):pb165Table.rows.map(h=>','card rows');
 s+='\n'+pb2063TablePage.toString()+'\n'+pb165PageControls.toString();
 }}
 if(!s.includes('function pb2050Formatter(')){
 s+='\n'+(function pb2050Formatter(locale,options){
 const cache=pb2050Formatter.cache||(pb2050Formatter.cache=new Map()),key=locale+JSON.stringify(options);
 if(!cache.has(key))cache.set(key,new Intl.DateTimeFormat(locale,options));
 return cache.get(key);
}).toString();
 for(const expression of ['new Intl.DateTimeFormat("en-US-u-ca-persian",{timeZone:"Asia/Tehran",year:"numeric",month:"numeric",day:"numeric"})','new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tehran",year:"numeric",month:"2-digit",day:"2-digit"})'])s=s.replaceAll(expression,expression.replace('new Intl.DateTimeFormat','pb2050Formatter'));
 }
 const a=s.indexOf('function ub({role:t,'),b=s.indexOf('}function hb(',a);
 if(a>=0&&b>a){let f=s.slice(a,b+1);if(f.includes('const Ve=r.filter(Je=>{')&&f.includes('}),he=Math.max(1,Math.ceil(Ve.length/N))')){
 f=once(f,'const Ve=r.filter(Je=>{','const Ve=x.useMemo(()=>r.filter(Je=>{','invoice memo');
 f=once(f,'}),he=Math.max(1,Math.ceil(Ve.length/N))','}),[r,l,t,pb1427InvoiceCustomer,_pbInvAppliedFrom,_pbInvAppliedTo]),he=Math.max(1,Math.ceil(Ve.length/N))','invoice memo deps');
 }if(f.includes('Ce=Pf("this_month"),'))f=once(f,'Ce=Pf("this_month"),','Ce=x.useMemo(()=>Pf("this_month"),[]),','month memo');s=s.slice(0,a)+f+s.slice(b+1);}
 return s+'\n/* PB165 native performance */\n';
}

function patchWalkin167(source){
 if(source.includes('/* PB167 stable walk-in launcher */'))return source;
 const a=source.indexOf('function mount(){'),b=source.indexOf('\nlet primaryState=',a);
 if(a<0||b<a)throw Error('PB167 intake mount missing');
 let mount=source.slice(a,b);
 // Keep the original authorization, modal, submission and click handlers.
 const target=/const\s+target\s*=[^;\n]+;/g;
 if([...mount.matchAll(target)].length!==1||!mount.includes('pb1137LocalIntakeButton'))throw Error('PB167 intake mount target incompatible');
 const route="const pb167Route=/^\\/lab\\/(?:orders(?:\\/|$)|album(?:s|[-/]|$)|print(?:\\/|$))/.test(location.pathname)||(location.pathname==='/lab'&&!!document.querySelector('.labRoleWorkspace .stageQueueWorkspace'));if(!pb167Route){old?.remove();return;}";
 const targets="const pb167Visible=n=>n&&n.isConnected&&n.getClientRects().length>0;const target=[document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'),document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader'),document.querySelector('.labRoleWorkspace .labSingleHeader'),host.querySelector('.ordersWorkspace'),host.querySelector('.stageQueueWorkspace')].find(pb167Visible);";
 const style="if(!document.getElementById('pb167IntakeStyle')){const style=document.createElement('style');style.id='pb167IntakeStyle';style.textContent='html body #root .labRoleWorkspace #pb1137LocalIntakeButton{display:inline-flex!important;visibility:visible!important;opacity:1!important;flex:0 0 auto!important;position:relative!important;z-index:2!important}html body #root .labRoleWorkspace .pb1148SecondaryHeader>#pb1137LocalIntakeButton{order:-1!important;margin-inline-end:auto!important}';document.head.append(style);}";
 mount=mount.replace(target,style+route+targets);
 return source.slice(0,a)+'/* PB167 stable walk-in launcher */\n'+mount+source.slice(b);
}

function patchNativeIntake(s){
 s=patchWalkin167(patchIntake(s));
 const old="for(const file of files){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');";
 if(s.includes(old)){const next="const pb165Files=[...files],pb165Hashes=new Array(pb165Files.length);let pb165Next=0,pb165Done=0;await Promise.all(Array.from({length:Math.min(3,pb165Files.length)},async()=>{for(;;){const i=pb165Next++;if(i>=pb165Files.length)return;pb165Hashes[i]=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await pb165Files[i].arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');error.textContent='در حال بررسی عکس‌ها: '+(++pb165Done)+' / '+pb165Files.length}}));for(let pb165I=0;pb165I<pb165Files.length;pb165I++){const file=pb165Files[pb165I],hash=pb165Hashes[pb165I];";s=once(s,old,next,'bounded hashing');}
 return s;
}
function patchManual(s){
 if(s.includes('function pb2056ManualCustomerPicker('))return s.replaceAll('limit=120','limit=32').replaceAll('limit+=120','limit+=32');
 return once(once(s,'function manual({api,customers=[],refresh}){',"function pb2056ManualCustomerPicker(customers){\n const root=node('div','pb2056ManualPicker'),trigger=node('button','pb2056ManualTrigger'),caption=node('span','pb2057ManualCaption','انتخاب عکاسی موجود / مشتری جدید'),arrow=node('span','pb2057ManualArrow');\n arrow.setAttribute('aria-hidden','true');trigger.append(caption,arrow);\n trigger.type='button';trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','true');\n const panel=node('div','pb2056ManualPanel');panel.hidden=true;\n const search=node('input');search.type='search';search.placeholder='جستجوی عکاسی…';search.setAttribute('aria-label','جستجوی عکاسی');search.autocomplete='off';\n const list=node('div','pb2056ManualList');list.setAttribute('aria-label','فهرست عکاسی‌ها');\n panel.append(search,list);root.append(trigger,panel);\n const empty={id:'',label:'انتخاب عکاسی موجود / مشتری جدید',key:''};\n const options=[empty,...customers.map(c=>{const label=String(c.name||'مشتری')+' · '+String(c.mobile||'');return {id:String(c.id),label,key:label.toLocaleLowerCase()}})];\n let value='',matches=[],limit=32;\n const control={element:root,get value(){return value},onchange:null,close};\n function place(){if(panel.hidden)return;const rect=trigger.getBoundingClientRect(),view=window.visualViewport,top=view?.offsetTop||0,height=view?.height||window.innerHeight,bottom=top+height,below=bottom-rect.bottom-12,above=rect.top-top-12;const up=below<270&&above>below;panel.classList.toggle('pb2057Above',up);list.style.maxHeight=Math.max(40,Math.min(200,Math.floor((up?above:below)-49)))+'px'}\n function outside(event){if(!root.contains(event.target))close()}\n function close(){panel.hidden=true;trigger.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true)}\n function select(option){value=option.id;caption.textContent=option.label;trigger.title=option.label;close();trigger.focus();control.onchange?.()}\n function append(){const end=Math.min(limit,matches.length),start=list.children.length,frag=document.createDocumentFragment();for(let i=start;i<end;i++){const option=matches[i],button=node('button','pb2056ManualOption',option.label);button.type='button';button.title=option.label;button.setAttribute('aria-pressed',String(option.id===value));button.onclick=()=>select(option);frag.append(button)}list.append(frag)}\n function render(){const query=search.value.trim().toLocaleLowerCase();matches=query?options.filter(o=>o.key.includes(query)):options;limit=32;list.replaceChildren();list.scrollTop=0;append();if(!matches.length)list.append(node('div','pb2056ManualEmpty','عکاسی یافت نشد.'))}\n function open(){panel.hidden=false;trigger.setAttribute('aria-expanded','true');search.value='';render();place();document.addEventListener('pointerdown',outside,true);window.addEventListener('resize',place);window.addEventListener('scroll',place,true);try{search.focus({preventScroll:true})}catch{search.focus()}}\n trigger.onclick=()=>panel.hidden?open():close();\n search.oninput=render;\n list.addEventListener('scroll',()=>{if(list.scrollTop+list.clientHeight>=list.scrollHeight-48&&limit<matches.length){limit+=32;append()}});\n root.addEventListener('focusout',event=>{if(event.relatedTarget&&!root.contains(event.relatedTarget))close()});\n root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();close();trigger.focus()}else if(event.key==='ArrowDown'&&event.target===search){const first=list.querySelector('button');if(first){event.preventDefault();first.focus()}}});\n return control;\n}\n"+'function manual({api,customers=[],refresh}){','manual helper')," const select=node('select');select.append(new Option('انتخاب عکاسی موجود / مشتری جدید',''));\n for(const customer of customers){select.append(new Option(String(customer.name||'مشتری')+' · '+String(customer.mobile||''),String(customer.id)));}\n labeled(grid,'طرف حساب',select);"," const select=pb2056ManualCustomerPicker(customers);labeled(grid,'طرف حساب',select.element);",'manual picker').replace("dialog.addEventListener('close',","dialog.addEventListener('close',()=>select.close());dialog.addEventListener('close',");
}
module.exports={patchRenderer,patchNativeIntake,patchManual,pb2063FirstIndex,pb2063TablePage};
