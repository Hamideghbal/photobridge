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
 section=once(section,"const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);if(item){additions.push({existing:item});}else additions.push({file,hash,size,paper,copies:1});","const item=pb2063ByHash.get(hash);if(item){additions.push({existing:item});}else{const entry={file,hash,size,paper,copies:1};additions.push(entry);pb2063ByHash.set(hash,entry);}");
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
module.exports={pb2063FirstIndex,pb2063TablePage,patchIntake,patchTable};
