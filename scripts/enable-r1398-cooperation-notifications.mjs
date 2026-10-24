import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1398 changed anchor '+a.slice(0,90));return s.replace(a,b)};
const labEvents="['collaboration_request','photographer_invite_accepted','photographer_removed_by_admin','photographer_removed_by_lab']";
const predicates=`function pb1398LabCooperation(p){return ${labEvents}.includes(p?.event)}\nfunction pb1398ReadOnly(p){return p?.event==='lab_membership_removed'||p?.event==='collaboration_review'&&(p?.metadata?.status||p?.status)==='rejected'}\n`;
let ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
if(!ui.includes('/* PB1398 cooperation notifications */')){
 ui=once(ui,'function Uu(t,a=!1){try{',"function Uu(t,a=!1){/* PB1398 cooperation notifications */if(a||t?.inviteAccepted||t?.status==='rejected')return;try{");fs.writeFileSync('dist/web/assets/index-UIRefine-v655-r84.js',ui);
}
const pushFile='dist/web/photobridge-push-v728.js';let push=fs.readFileSync(pushFile,'utf8');
if(!push.includes('function pb1398ReadOnly')){
 const a=push.indexOf('  function showToast(payload){'),b=push.indexOf('\n',a);if(a<0||b<a)throw Error('R1398 toast anchor');
 push=push.slice(0,a)+predicates+`  function showToast(payload){
    if(role()==='lab'&&pb1398LabCooperation(payload))return;
    ensureStyle();document.querySelectorAll('.pbPushToastV728').forEach(x=>x.remove());
    const el=document.createElement('div');el.className='pbPushToastV728';
    el.innerHTML='<img src="/photobridge-icon-192-v783.png" alt=""><div><b></b><p></p></div>';
    el.querySelector('b').textContent=String(payload?.title||'PhotoBridge');el.querySelector('p').textContent=String(payload?.body||'اعلان جدید');
    if(!pb1398ReadOnly(payload)){const button=document.createElement('button');button.type='button';button.className='pbPushOpen';button.textContent=String(payload?.actionLabel||'مشاهده');const open=()=>location.assign(targetWithId(payload));button.addEventListener('click',e=>{e.stopPropagation();open()});el.append(button);el.addEventListener('click',open)}else{el.setAttribute('role','status');el.style.cursor='default'}
    document.body.appendChild(el);setTimeout(()=>el.remove(),6500);
  }`+push.slice(b);
 push=once(push,'playForegroundSound();showToast(payload);',"if(!(role()==='lab'&&pb1398LabCooperation(payload))){playForegroundSound();showToast(payload);}");
 push=push.replace("?gallery=r1318'","?gallery=r1318&cooperation=r1398'");fs.writeFileSync(pushFile,push);
}
const swFile='dist/web/photobridge-sw-v710.js';let sw=fs.readFileSync(swFile,'utf8');
if(!sw.includes('function pb1398ReadOnly')){
 sw=predicates+sw;
 sw=once(sw,'      return;\n    }\n    await self.registration.showNotification', '      if(!pb1398LabCooperation(data))return;\n    }\n    await self.registration.showNotification');
 sw=once(sw,"actions:[{action:'open',title:pb783Rtl(data.actionLabel||'مشاهده')}],","actions:pb1398ReadOnly(data)?[]:[{action:'open',title:pb783Rtl(data.actionLabel||'مشاهده')}],");
 sw=once(sw,'  event.notification.close();',"  event.notification.close();\n  if(pb1398ReadOnly(event.notification?.data))return;");
 fs.writeFileSync(swFile,sw);
}
const serverFile='dist/api/server.js';let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1398 native toast owner */')){
 server="import {markNativeInfoOwner,nativeInfoOwnerActive} from './lab-notification-owner.js';\n/* PB1398 native toast owner */\n"+server;
 server=once(server,"        if (req.method === 'GET' && url.pathname === '/api/lab/notifications') {","        if (req.method === 'GET' && url.pathname === '/api/lab/notifications') {\n            if(req.headers['x-photobridge-native-info-alerts']==='1')markNativeInfoOwner(labId);");
 server=once(server,'    if (!notificationRow || !recipientId) return {accepted:0};','    if (!notificationRow || !recipientId) return {accepted:0};\n    if(kind===\'lab\'&&'+labEvents+'.includes(event)&&nativeInfoOwnerActive(recipientId))return {accepted:0,nativeOwner:true};');
}

if(!server.includes('/* PB1398 cooperation deep link */')){
 server=once(server,"        if (event === 'collaboration_request' || event === 'photographer_invite_accepted'", "        /* PB1398 cooperation deep link */\n        if (event === 'collaboration_request') return '/lab/settings/customers/collaboration';\n        if (event === 'photographer_invite_accepted'");fs.writeFileSync(serverFile,server);
}
fs.writeFileSync(serverFile,server);
const page='dist/web/index.html';let html=fs.readFileSync(page,'utf8');html=html.replace(/((?:photobridge-push-v728|index-UIRefine-v655-r84)\.js\?[^"']*)/g,u=>u.includes('&cooperationAlerts=')?u:u+'&cooperationAlerts=r1398');fs.writeFileSync(page,html);
