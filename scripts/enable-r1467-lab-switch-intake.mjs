import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1467 unsafe anchor: '+a.slice(0,100));return s.replace(a,b)};
const uiPath='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(uiPath,'utf8');
if(!ui.includes('/* PB1467 committed lab selection */')){
 const a='if(oe!==K.current)return;S(((Ye==null?void 0:Ye.memberships)||[]).filter(Be=>!Be.service_only));';if(ui.split(a).length!==3)throw Error('R1467 expected two native lab switch handlers');
 ui=ui.replaceAll(a,'if(oe!==K.current)return;try{sessionStorage.setItem("photobridge:r99:selected-lab",String(P));window.dispatchEvent(new CustomEvent("photobridge-lab-selected",{detail:{labId:String(P)}}));}catch{}S(((Ye==null?void 0:Ye.memberships)||[]).filter(Be=>!Be.service_only));');
 fs.writeFileSync(uiPath,ui+'\n/* PB1467 committed lab selection */\n');
}
const chooserPath='dist/web/photobridge-v904r99-lab-chooser.js';let chooser=fs.readFileSync(chooserPath,'utf8');
if(!chooser.includes('/* PB1467 lab chooser synchronization */')){
 chooser=once(chooser,'  function paint(data){',`  /* PB1467 lab chooser synchronization */
  window.addEventListener('photobridge-lab-selected',event=>{
   const id=String(event.detail?.labId||'');if(!id)return;
   sessionStorage.setItem(SESSION_KEY,id);currentData=null;lastPath='';refreshQueued=false;cleanup();
  });
  function paint(data){`);fs.writeFileSync(chooserPath,chooser);
}
const intakePath='dist/web/photobridge-r1137-lab-local-intake.js';let intake=fs.readFileSync(intakePath,'utf8');
if(!intake.includes('/* PB1467 live intake requests */')){
 intake=once(intake,"async function api(url,body){try{return await storage().request(url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});}",`/* PB1467 live intake requests */
async function api(url,body){try{
 const live=/^\\/api\\/lab\\/delegated-orders(?:\\/[0-9a-f-]+\\/(?:files\\/presign|submit))?$/.test(url)||/^\\/api\\/lab\\/orders\\/[0-9a-f-]+$/.test(url);
 const result=await storage().request(live?url+'/download':url,{...(body?{method:'POST',body:JSON.stringify(body)}:{})});
 if(result?.queued||result?.operationId)throw Object.assign(Error('intake_requires_live_connection'),{data:{message:'ثبت سفارش حضوری به ارتباط زنده با سرور نیاز دارد. اتصال را بررسی و دوباره تلاش کنید؛ فایل مبدأ حذف نشده است.'}});
 return result;
}`);
 intake=once(intake,'  controls.append(localNotice);details.append(controls);','  const actionRow=node(\'div\',null,\'pb1467AccountActionRow\');for(const control of [...controls.children])if(!control.classList.contains(\'pb1294InitialEdit\'))actionRow.append(control);controls.prepend(actionRow);controls.append(localNotice);details.append(controls);');
 fs.writeFileSync(intakePath,intake);
}
const serverPath='dist/api/server.js';let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes('/* PB1467 live manual intake aliases */')){
 server=once(server,"url.pathname === '/api/lab/delegated-orders')", "['/api/lab/delegated-orders','/api/lab/delegated-orders/download'].includes(url.pathname))");
 for(const name of ['delegatedFiles','submitDelegatedOrder']){const re=new RegExp('const '+name+' = url\\.pathname\\.match\\(([^;]+)\\);'),match=server.match(re);if(!match)throw Error('R1467 live route '+name);server=once(server,match[0],match[0].replace('$/','(?:\\/download)?$/'));}
 server+='\n/* PB1467 live manual intake aliases */\n';fs.writeFileSync(serverPath,server);
}
fs.copyFileSync('scripts/r1466-intake-move.js','dist/web/photobridge-r1466-intake-move.js');fs.copyFileSync('scripts/r1467-embedded-route.js','dist/web/photobridge-r1467-embedded-route.js');
const css=`/* PB1467 intake account row */.pb1137Intake .pb1365CustomerAccountRow .pb1294AccountActions{display:block!important;position:relative}.pb1137Intake .pb1467AccountActionRow{display:flex!important;flex-flow:row nowrap!important;align-items:center!important;gap:8px!important;white-space:nowrap}.pb1137Intake .pb1467AccountActionRow>.pb1365SmsChoice{display:inline-flex!important;flex-direction:row!important;align-items:center!important;margin:0!important;padding:0!important;min-width:0!important;line-height:1.4!important}.pb1137Intake .pb1467AccountActionRow>button{height:29px!important;min-height:29px!important;width:auto!important;white-space:nowrap;font:inherit;font-size:11px!important;padding:3px 8px!important}.pb1137Intake .pb1467AccountActionRow>.pb1365SmsChoice input{margin:0!important;flex:0 0 16px!important}.pb1466SourceFiles>span{font-size:12px;padding:5px;overflow-wrap:anywhere}`;
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(path,'utf8');if(!html.includes('/photobridge-r1467-embedded-route.js'))html=html.replace('</head>','<script defer src="/photobridge-r1467-embedded-route.js?v=r1467"></script><style>'+css+'</style></head>');
 html=html.replace(/((?:index-UIRefine-v655-r84\.js|photobridge-v904r99-lab-chooser\.js|photobridge-r1137-lab-local-intake\.js|photobridge-r1466-intake-move\.js)\?[^"'\s]*)/g,url=>url.includes('labSwitchIntake=r1467')?url:url+'&labSwitchIntake=r1467');fs.writeFileSync(path,html);
}
for(const path of [uiPath,chooserPath,intakePath,serverPath,'dist/web/photobridge-r1466-intake-move.js','dist/web/photobridge-r1467-embedded-route.js'])execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
