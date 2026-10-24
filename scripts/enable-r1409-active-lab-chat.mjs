import fs from 'node:fs';

const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1409 changed anchor ('+n+'): '+a.slice(0,95));return s.replace(a,b)};
const frontend='dist/web/assets/index-UIRefine-v655-r84.js';
const mark='/* PB1409 lab context and chat startup */';
let ui=fs.readFileSync(frontend,'utf8');
if(!ui.includes(mark)){
 const shellStart=ui.indexOf('function bc('),chatStart=ui.indexOf('function aw(',shellStart),chatEnd=ui.indexOf('function iw(',chatStart);
 if(shellStart<0||chatStart<0||chatEnd<0)throw Error('R1409 missing workspace/chat functions');
 let shell=ui.slice(shellStart,chatStart);
 shell=once(shell,'const r=t==="customer"&&!!((g=a.lab)!=null&&g.service_only),o=',
  'const [pbLab,pbSetLab]=x.useState(()=>a.lab||null);x.useEffect(()=>{if(t!=="customer")return;const changed=event=>{const d=event.detail||{};if(String(d.userId)!==String(a.user.userId)||!d.lab?.id)return;pbSetLab(d.lab)};window.addEventListener("pb-customer-active-lab",changed);return()=>window.removeEventListener("pb-customer-active-lab",changed)},[t,a.user.userId]);x.useEffect(()=>{if(t==="customer")pbSetLab(a.lab||null)},[t,a.user.userId,a.lab?.id]);const pbChatLab=t==="customer"?(pbLab||a.lab):a.lab,pbChatMe=t==="customer"?{...a,lab:pbChatLab}:a,r=t==="customer"&&!!pbChatLab?.service_only,o=');
 shell=once(shell,'e.jsx(aw,{role:t,me:a,collapsed:l,setCollapsed:m},`${a.user.userId}:${a.lab?.id||a.user.labId||""}`)',
  'e.jsx(aw,{role:t,me:pbChatMe,collapsed:l,setCollapsed:m},`${a.user.userId}:${pbChatLab?.id||a.user.labId||""}`)');
 ui=ui.slice(0,shellStart)+shell+ui.slice(chatStart);
 const p=ui.indexOf('function Hf('),q=ui.indexOf('function bc(',p);
 if(p<0||q<0)throw Error('R1409 missing photographer app');
 let photographer=ui.slice(p,q);
 photographer=once(photographer,'f(P),P!=null&&P.collaborationNotice&&He(P.collaborationNotice,!1)',
  'f(P),P?.lab?.id&&window.dispatchEvent(new CustomEvent("pb-customer-active-lab",{detail:{userId:String(t.user.userId||t.user.id),lab:P.lab}})),P!=null&&P.collaborationNotice&&He(P.collaborationNotice,!1)');
 ui=ui.slice(0,p)+photographer+ui.slice(q);
 const start=ui.indexOf('function aw('),end=ui.indexOf('function iw(',start);let chat=ui.slice(start,end);
 chat=once(chat,'M=`lablink_chat_seen_${t}_${a.user.userId}`',
  'M=`lablink_chat_seen_${t}_${a.user.userId}${t==="customer"?"_"+(a.lab?.id||a.user.labId||""):""}`');
 chat=once(chat,'x.useEffect(()=>{ae().catch(()=>{}),$().catch(()=>{});const ie=setInterval(()=>$().catch(()=>{}),5e3);return()=>clearInterval(ie)},[t,s,pbAccount])',
  'x.useEffect(()=>{const check=()=>{if(t!=="customer"||s)$().catch(()=>{})};const startup=setTimeout(check,t==="lab"?650:0),ie=setInterval(check,t==="lab"&&s?12e3:5e3);return()=>{clearTimeout(startup);clearInterval(ie)}},[t,s,pbAccount])');
 ui=ui.slice(0,start)+chat+ui.slice(end)+'\n'+mark+'\n';
 fs.writeFileSync(frontend,ui);
}

const serverPath='dist/api/server.js';
const serverMark='/* PB1409 efficient lab chat contacts */';
let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes(serverMark)){
 const from='SELECT u.id,u.name,u.email,u.mobile,m.active,\n        (SELECT cm.message FROM chat_messages cm WHERE cm.lab_id=$1 AND cm.customer_id=u.id ORDER BY cm.created_at DESC LIMIT 1) last_message,\n        (SELECT cm.created_at FROM chat_messages cm WHERE cm.lab_id=$1 AND cm.customer_id=u.id ORDER BY cm.created_at DESC LIMIT 1) last_message_at,\n        (SELECT cm.sender_id FROM chat_messages cm WHERE cm.lab_id=$1 AND cm.customer_id=u.id ORDER BY cm.created_at DESC LIMIT 1) last_sender_id\n        FROM lab_memberships m JOIN users u ON u.id=m.user_id\n        WHERE m.lab_id=$1 AND m.role=\'customer\'\n        ORDER BY last_message_at DESC NULLS LAST,m.created_at DESC';
 const to='SELECT u.id,u.name,u.email,u.mobile,m.active,\n        last_cm.message AS last_message,last_cm.created_at AS last_message_at,last_cm.sender_id AS last_sender_id\n        FROM lab_memberships m JOIN users u ON u.id=m.user_id\n        LEFT JOIN LATERAL (SELECT cm.message,cm.created_at,cm.sender_id FROM chat_messages cm\n          WHERE cm.lab_id=$1 AND cm.customer_id=u.id ORDER BY cm.created_at DESC LIMIT 1) last_cm ON TRUE\n        WHERE m.lab_id=$1 AND m.role=\'customer\'\n        ORDER BY last_message_at DESC NULLS LAST,m.created_at DESC';
 server=once(server,from,to);
 fs.writeFileSync(serverPath,server+'\n'+serverMark+'\n');
}
const htmlFile='dist/web/index.html';
if(fs.existsSync(htmlFile)){
 let html=fs.readFileSync(htmlFile,'utf8');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.replace(/&activeLabChat=[^&"']*/g,'')+'&activeLabChat=r1409');
 fs.writeFileSync(htmlFile,html);
}
