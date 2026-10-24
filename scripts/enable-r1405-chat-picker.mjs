import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1405 changed anchor: '+a.slice(0,90));return s.replace(a,b)};
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1405 chat picker */')){
 const from=ui.indexOf('function aw('),end=ui.indexOf('function iw(',from);if(from<0||end<0)throw Error('R1405 missing chat');let chat=ui.slice(from,end);
 const a=chat.indexOf('M=`lablink_chat_seen_'),b=chat.indexOf(';x.useEffect(()=>{ae()',a);if(a<0||b<0)throw Error('R1405 poll state changed');
 const state=fs.readFileSync('scripts/r1405-chat-state.js','utf8').trim();chat=chat.slice(0,a)+state+chat.slice(b);
 const listStart=chat.indexOf('t==="lab"&&e.jsxs("div",{className:"chatContacts"'),listEnd=chat.indexOf(',re?e.jsxs(',listStart);if(listStart<0||listEnd<0)throw Error('R1405 contacts markup changed');
 chat=chat.slice(0,listStart)+`t==="lab"&&e.jsx(PB1405Contacts,{contacts:o,userId:a.user.userId,seen:pbSeen,baseline:B(),platform:g,onPlatform:()=>{p(!0);m(null);y("")},onSelect:contact=>{p(!1);m(contact);y("")}},pbAccount)`+chat.slice(listEnd);
 chat=once(chat,'5e3);return()=>clearInterval(ie)},[t,s])','5e3);return()=>clearInterval(ie)},[t,s,pbAccount])');
 chat=once(chat,'[t,c==null?void 0:c.id,g,s]);','[t,c==null?void 0:c.id,g,s,pbAccount]);');
 // Scope ref is refreshed synchronously with render; old requests cannot publish after a thread/account change.
 const marker='if(s)return e.jsx("aside"';const p=chat.indexOf(marker);if(p<0)throw Error('R1405 return anchor');
 // Must run before the existing effects, not after the collapsed conditional.
 const effects=chat.indexOf(';x.useEffect(()=>{ae()');chat=chat.slice(0,effects)+`;pbLive.current.scope=pbScope;pbLive.current.account=pbAccount;x.useEffect(()=>{pbLive.current.alive=true;return()=>{pbLive.current.alive=false}},[pbAccount])`+chat.slice(effects);
 ui=ui.slice(0,from)+chat+ui.slice(end)+'\n/* PB1405 chat picker */\n'+fs.readFileSync('scripts/r1405-chat-picker.js','utf8');ui=once(ui,'e.jsx(aw,{role:t,me:a,collapsed:l,setCollapsed:m})','e.jsx(aw,{role:t,me:a,collapsed:l,setCollapsed:m},`${a.user.userId}:${a.lab?.id||a.user.labId||""}`)');fs.writeFileSync(file,ui);
}
const index='dist/web/index.html';if(fs.existsSync(index)){let html=fs.readFileSync(index,'utf8');if(!html.includes('/photobridge-r1405-chat-picker.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1405-chat-picker.css?v=r1405"></head>');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&chatPicker=[^&"']*/g,'')+'&chatPicker=r1405');fs.writeFileSync(index,html)}
