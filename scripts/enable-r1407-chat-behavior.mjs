import fs from 'node:fs';

const jsPath='dist/web/assets/index-UIRefine-v655-r84.js';
const marker='/* PB1407 chat header and collapse */';
const once=(source,from,to)=>{
 const n=source.split(from).length-1;
 if(n!==1)throw Error('R1407 expected one anchor, got '+n+': '+from.slice(0,90));
 return source.replace(from,to);
};
let ui=fs.readFileSync(jsPath,'utf8');
if(!ui.includes(marker)){
 const start=ui.indexOf('function aw('),end=ui.indexOf('function iw(',start);
 if(start<0||end<0)throw Error('R1407 chat module missing');
 let chat=ui.slice(start,end);
 // Ignore outside clicks while the photographer picker is open; never swallow internal controls.
 const collapse='x.useEffect(()=>{if(s)return;const onOutside=event=>{if(event.button!=null&&event.button!==0)return;const target=event.target;if(!target||typeof target.closest!=="function")return;if(target.closest(".chatDock"))return;if(document.querySelector("dialog.pb1405Picker[open]"))return;r(!0)};document.addEventListener("pointerdown",onOutside,!0);return()=>document.removeEventListener("pointerdown",onOutside,!0)},[s,r]);';
 // Measure the visible first laboratory header instead of the lower page rails.
 const labHeader='x.useEffect(()=>{if(t!=="lab"||s)return;let observer;const update=()=>{const headers=[...document.querySelectorAll(".labRoleWorkspace .unifiedRoleHeader")];const header=headers.find(node=>{const rect=node.getBoundingClientRect();return rect.height>0&&getComputedStyle(node).visibility!=="hidden"&&getComputedStyle(node).display!=="none"});const bottom=header?header.getBoundingClientRect().bottom:72;document.documentElement.style.setProperty("--pb1407-lab-chat-top",Math.max(78,Math.ceil(bottom)+10)+"px")};update();window.addEventListener("resize",update);const node=document.querySelector(".labRoleWorkspace .unifiedRoleHeader");if(node&&typeof ResizeObserver!=="undefined"){observer=new ResizeObserver(update);observer.observe(node)}return()=>{window.removeEventListener("resize",update);observer?.disconnect();document.documentElement.style.removeProperty("--pb1407-lab-chat-top")}},[s,t]);';
 chat=once(chat,'if(s)return e.jsx("aside",{className:"chatDock collapsed "',collapse+labHeader+'if(s)return e.jsx("aside",{className:"chatDock collapsed "');
 const arrow='e.jsx("button",{className:"chatCloseButton",onClick:()=>r(!0),title:"بستن گفتگو","aria-label":"بستن گفتگو",children:"‹"})';
 const chevron='e.jsx("button",{className:"chatCloseButton",onClick:()=>r(!0),title:"جمع کردن گفتگو","aria-label":"جمع کردن گفتگو",children:e.jsx("svg",{viewBox:"0 0 24 24",width:20,height:20,fill:"none",stroke:"currentColor",strokeWidth:2.8,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":true,children:e.jsx("path",{d:"m15 18-6-6 6-6"})})})';
 chat=once(chat,arrow,chevron);
 ui=ui.slice(0,start)+chat+ui.slice(end)+'\n'+marker+'\n';
 fs.writeFileSync(jsPath,ui);
}

const htmlPath='dist/web/index.html';
if(fs.existsSync(htmlPath)){
 let html=fs.readFileSync(htmlPath,'utf8');
 if(!html.includes('/photobridge-r1407-chat-behavior.css')){
  html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1407-chat-behavior.css?v=r1407"></head>');
 }
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.replace(/&chatBehavior=[^&"']*/g,'')+'&chatBehavior=r1407');
 fs.writeFileSync(htmlPath,html);
}
