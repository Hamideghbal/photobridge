'use strict';
function patchInlineBackup(source,native){
 if(source.includes('/* PB162 inline backup */'))return source;
 const start=source.indexOf('function Nj({d:t,'),body=source.indexOf('g==="backup"&&e.jsxs("section"',start),next=source.indexOf(',g==="general"&&',body);
 if(start<0)throw Error('backup162_panel');
 const legacy=body<start;
 if(!legacy&&(next<body||next-body>5000||!source.slice(body,next).includes('/lab-data-backup.html')))throw Error('backup162_existing_panel');
 if(legacy&&!native)throw Error('backup162_panel');
 // Preserve settings routing and the single settings scroll area.
 const frame='g==="backup"&&e.jsx("iframe",{className:"pb162BackupFrame",title:"پشتیبان اطلاعات",src:"'+(native?'/desktop/backups?embedded=1':'/lab-data-backup.html?embedded=1')+'",style:{display:"block",width:"100%",border:0,minHeight:520,background:"transparent"},onLoad:event=>{const frame=event.currentTarget;try{const doc=frame.contentDocument,main=doc.querySelector("main");if(!main)return;const back=doc.querySelector(".back");if(back)back.style.display="none";const resize=()=>{if(frame.isConnected)frame.style.height=Math.max(520,Math.ceil(main.getBoundingClientRect().height)+16)+"px"};resize();if(frame.contentWindow.ResizeObserver){const observer=new frame.contentWindow.ResizeObserver(resize);observer.observe(main)}}catch{}}})';
 if(legacy){
  const general=source.indexOf(',g==="general"&&',start);if(general<start)throw Error('backup162_legacy_general');
  source=source.slice(0,general)+','+frame+source.slice(general);
  const allowed='new Set(["general","subscription","wallet","customers","prices","album","payment","walkin","walkin-prices","hours","resolution","local","sms","snappbox","site","desktop"])';
  if(source.split(allowed).length!==2)throw Error('backup162_legacy_routes');source=source.replace(allowed,allowed.replace('"desktop"','"desktop","backup"'));
 }else source=source.slice(0,body)+frame+source.slice(next);
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
