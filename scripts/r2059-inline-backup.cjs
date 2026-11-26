'use strict';
function patchInlineBackup(source,native){
 if(source.includes('/* PB162 inline backup */'))return source;
 const start=source.indexOf('function Nj({d:t,'),body=source.indexOf('g==="backup"&&e.jsxs("section"',start),next=source.indexOf(',g==="general"&&',body);
 if(start<0||body<start||next<body||next-body>5000)throw Error('backup162_panel');
 const old=source.slice(body,next);
 if(!old.includes('/lab-data-backup.html'))throw Error('backup162_existing_panel');
 // Preserve settings routing and the single settings scroll area.
 const frame='g==="backup"&&e.jsx("iframe",{className:"pb162BackupFrame",title:"پشتیبان اطلاعات",src:"'+(native?'/desktop/backups?embedded=1':'/lab-data-backup.html?embedded=1')+'",style:{display:"block",width:"100%",border:0,minHeight:520,background:"transparent"},onLoad:event=>{const frame=event.currentTarget;try{const doc=frame.contentDocument,main=doc.querySelector("main");if(!main)return;const back=doc.querySelector(".back");if(back)back.style.display="none";const resize=()=>{if(frame.isConnected)frame.style.height=Math.max(520,Math.ceil(main.getBoundingClientRect().height)+16)+"px"};resize();if(frame.contentWindow.ResizeObserver){const observer=new frame.contentWindow.ResizeObserver(resize);observer.observe(main)}}catch{}}})';
 source=source.slice(0,body)+frame+source.slice(next);
 const group=source.indexOf('key:"general",label:"عمومی"',start),groupEnd=source.indexOf('},{key:',group);
 if(group<start||groupEnd<group)throw Error('backup162_general');
 let general=source.slice(group,groupEnd);
 if(!general.includes('["backup",')){
  const at=general.lastIndexOf(']]');if(at<0)throw Error('backup162_items');
  general=general.slice(0,at+1)+',["backup","پشتیبان اطلاعات برنامه"]'+general.slice(at+1);
 }else general=general.replace(/\["backup","[^"]*"\]/,'["backup","پشتیبان اطلاعات برنامه"]');
 source=source.slice(0,group)+general+source.slice(groupEnd);
 const after=group+general.length;
 source=source.slice(0,after)+source.slice(after).replace(/,\["backup","پشتیبان اطلاعات (?:سایت|برنامه)"\]/,'');
 // Some previous native UI payloads carry an old standalone launcher. The real
 // settings tab replaces it; never navigate away from the main workspace.
 if(native)source=source.replaceAll("location.assign('/desktop/backups')","Dn('/lab/settings/backup')").replaceAll("button.href='/desktop/backups'","button.href='/lab/settings/backup'");
 return source+'\n/* PB162 inline backup */\n';
}
function patchInvoiceAll(source){
 const start=source.indexOf('function ub({role:t'),end=source.indexOf('}function hb(',start);
 if(start<0||end<start)throw Error('R2059 finance component');
 let part=source.slice(start,end+1);
 if(part.includes('data-pb162-invoice-all'))return source;
 const at=part.indexOf('children:"نمایش همه"',part.indexOf('w==="invoices"&&')),btn=part.lastIndexOf('e.jsx("button",{',at);
 if(at<0||btn<0)throw Error('R2059 invoice all anchor');
 let button=part.slice(btn,at);
 if(!button.includes('_setPbInvAppliedFrom("")')||!button.includes('_setPbInvAppliedTo("")'))throw Error('R2059 all action');
 if(!button.includes('"aria-pressed":'))button+='"aria-pressed":!_pbInvAppliedFrom&&!_pbInvAppliedTo,';
 button+='"data-pb162-invoice-all":true,';
 part=part.slice(0,btn)+button+part.slice(at);
 return source.slice(0,start)+part+source.slice(end+1);
}
module.exports={patchInlineBackup,patchInvoiceAll};

