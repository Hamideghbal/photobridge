import fs from 'node:fs';

const file='dist/web/assets/index-UIRefine-v655-r84.js';
const marker='/* PB1406 compact lab chat */';
const replaceOnce=(source,oldText,newText)=>{
  const matches=source.split(oldText).length-1;
  if(matches!==1)throw Error('R1406 anchor changed ('+matches+'): '+oldText.slice(0,105));
  return source.replace(oldText,newText);
};

let ui=fs.readFileSync(file,'utf8');
if(!ui.includes(marker)){
  const from=ui.indexOf('function aw('),to=ui.indexOf('function iw(',from);
  if(from<0||to<0)throw Error('R1406 chat function not found');
  let chat=ui.slice(from,to);
  const updates=[
    ['if(K==="platform"){p(!0),m(null),C.current=!0;return}','if(K==="platform"){C.current=!0;return}'],
    ['t==="lab"?"عکاسی‌ها و پشتیبانی"','t==="lab"?"گفتگوی عکاسی‌ها"'],
    ['platform:g,onPlatform:()=>{p(!0);m(null);y("")},',''],
    ['const re=t==="customer"||g||!!c;','const re=t==="customer"||!!c;'],
    ['children:g||t==="customer"?"L":','children:t==="customer"?"L":'],
    ['children:g?"پشتیبانی پلتفرم":t==="customer"?','children:t==="customer"?'],
    ['children:g?"Admin ↔ Lab":"گفتگوی مستقیم"','children:"گفتگوی مستقیم"'],
    ['const route=t===\'lab\'?(g?\'/api/lab/platform-chat\':c?','const route=t===\'lab\'?(c?'],
    ['const[K,fe]=await Promise.all([ae(),Me(\'/api/lab/platform-chat\')]);','const K=await ae();'],
    ['J([...(K||[]).filter(Ce=>Ce.last_sender_id&&Ce.last_sender_id!==a.user.userId).map(Ce=>new Date(Ce.last_message_at).getTime()),...(fe.messages||[]).filter(Ce=>Ce.sender_id!==a.user.userId).map(Ce=>new Date(Ce.created_at).getTime())]);','J((K||[]).filter(Ce=>Ce.last_sender_id&&Ce.last_sender_id!==a.user.userId).map(Ce=>new Date(Ce.last_message_at).getTime()));'],
    ['const seen=pbLive.current.seen,be=K.filter(Ce=>pb1405Unread(Ce,a.user.userId,seen,ie)).length,Z=(fe.messages||[]).filter(Ce=>Ce.sender_id!==a.user.userId&&pb1405Timestamp(Ce.created_at)>Number(seen.platform??ie)).length;T(be+Z)','const seen=pbLive.current.seen,be=K.filter(Ce=>pb1405Unread(Ce,a.user.userId,seen,ie)).length;T(be)'],
    ['if(t==="lab"&&g)await Me("/api/lab/platform-chat",{method:"POST",body:JSON.stringify({message:ie})});','if(t==="lab"&&g)return;']
  ];
  for(const [oldText,newText] of updates)chat=replaceOnce(chat,oldText,newText);
  ui=ui.slice(0,from)+chat+ui.slice(to);
  ui=replaceOnce(ui,'function PB1405Contacts({contacts,userId,seen,baseline,onSelect,platform,onPlatform}){','function PB1405Contacts({contacts,userId,seen,baseline,onSelect}){');
  ui=replaceOnce(ui,",e.jsx('button',{type:'button',className:platform?'active':'',onClick:onPlatform,children:'پشتیبانی'})",'');
  fs.writeFileSync(file,ui+'\n'+marker+'\n');
}

const htmlFile='dist/web/index.html';
if(fs.existsSync(htmlFile)){
  let html=fs.readFileSync(htmlFile,'utf8');
  if(!html.includes('photobridge-r1406-lab-chat.css')){
    html=replaceOnce(html,'</head>','<link rel="stylesheet" href="/photobridge-r1406-lab-chat.css?v=r1406"></head>');
  }
  html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.replace(/&chatLayout=[^&"']*/g,'')+'&chatLayout=r1406');
  fs.writeFileSync(htmlFile,html);
}
