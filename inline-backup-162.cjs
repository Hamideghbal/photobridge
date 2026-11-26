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
module.exports={patchInlineBackup};
