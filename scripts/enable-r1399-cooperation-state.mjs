import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1399 changed anchor '+a.slice(0,100));return s.replace(a,b)};
const file='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1399 cooperation state */')){
 const seen=s.indexOf('pb_lab_collaboration_seen_'),a=s.lastIndexOf('x.useEffect(()=>{',seen),b=s.indexOf(']);',seen)+3;if(seen<0||a<0||b<a)throw Error('R1399 pending effect changed');
 s=s.slice(0,a)+"x.useEffect(()=>pb1399WatchPending({request:Me,onPending:L}),[t.user.id,l?.lab?.id]);"+s.slice(b);
 const old='L(pe),Uu(pe,!0),window.setTimeout(()=>L(ve=>(ve==null?void 0:ve.requestId)===(pe==null?void 0:pe.requestId)?null:ve),12e3)';
 s=once(s,old,"L({...pe,persistent:!0}),window.dispatchEvent(new CustomEvent('photobridge-lab-pending-refresh')),Uu(pe,!0)");
 const banner=s.indexOf('B&&e.jsxs("div",{className:"collaborationGlobalAlert labCollaborationAlert '),end=s.indexOf(']}),',s.indexOf('className:"collaborationAlertDismiss"',banner))+4;if(banner<0||end<banner)throw Error('R1399 banner boundary');
 const part=s.slice(banner,end);s=s.slice(0,banner)+once(part,'onClick:()=>L(null)',"onClick:()=>{if(!B.accepted&&!B.removed)window.dispatchEvent(new CustomEvent('photobridge-lab-pending-dismiss'));L(null)}")+s.slice(end);
 s=once(s,'if(T==="reject"&&!confirm(`درخواست همکاری «${I.name}» رد شود؟`))return;', 'if(T==="reject"&&!await pb1397ReviewDialog(`درخواست همکاری «${I.name}» رد شود؟`,{confirm:true,title:"رد درخواست همکاری",confirmText:"رد درخواست"}))return;');
 s=once(s,'const state=T==="approve"?"approved":"rejected";', 'const state=T==="approve"?"approved":"rejected";window.dispatchEvent(new CustomEvent("photobridge-collaboration-reviewed",{detail:{requestId:I.id,requestedAt:I.requested_at,status:state}}));');
 s=once(s,'if(x.useEffect(()=>{l()},[]),!a)return e.jsx("section",{className:"card panel compactPanel",children:e.jsx("div",{className:"loadingBox",children:"در حال دریافت لابراتوارهای PhotoBridge…"})});', 'if(x.useEffect(()=>pb1399WatchDirectory({request:Me,onData:s}),[]),!a)return e.jsx("section",{className:"card panel compactPanel",children:e.jsx("div",{className:"loadingBox",children:"در حال دریافت لابراتوارهای PhotoBridge…"})});');
 const start=s.indexOf('const He=(P,b=!1)=>'),finish=s.indexOf('},ft=(P,b,oe=',start);if(start<0||finish<start)throw Error('R1399 review event handler');
 let handler=s.slice(start,finish);handler=once(handler,';!b&&localStorage.getItem(ee)', ';window.dispatchEvent(new CustomEvent("photobridge-collaboration-review",{detail:oe}));!b&&localStorage.getItem(ee)');s=s.slice(0,start)+handler+s.slice(finish);
 const dialogStart=s.indexOf('function pb1397ReviewDialog('),dialogEnd=s.indexOf('\n}',dialogStart)+2;if(dialogStart<0||dialogEnd<dialogStart)throw Error('R1399 dialog helper');
 s=s.slice(0,dialogStart)+fs.readFileSync('scripts/r1397-review-dialog.js','utf8')+s.slice(dialogEnd);
 s+='\n/* PB1399 cooperation state */\n'+fs.readFileSync('scripts/r1399-cooperation-state.js','utf8');fs.writeFileSync(file,s);
}
const pushFile='dist/web/photobridge-push-v728.js';let push=fs.readFileSync(pushFile,'utf8');if(!push.includes('/* PB1399 review broadcast */')){push=once(push,'void setAppBadge(Number(payload.unreadCount||1));',"void setAppBadge(Number(payload.unreadCount||1));/* PB1399 review broadcast */if(payload.event==='collaboration_review')window.dispatchEvent(new CustomEvent('photobridge-collaboration-review',{detail:payload.metadata||payload}));");fs.writeFileSync(pushFile,push)}
const page='dist/web/index.html';let html=fs.readFileSync(page,'utf8');for(const name of ['index-UIRefine-v655-r84.js','photobridge-push-v728.js','photobridge-r1397-review-dialog.css'])html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?[^"\']*)','g'),u=>u.includes('&cooperationState=')?u:u+'&cooperationState=r1399');fs.writeFileSync(page,html);
