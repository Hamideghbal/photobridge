'use strict';
const $=id=>document.getElementById(id);let state={items:[],settings:{}},timer=null,context=null,played=new Set(),saveChain=Promise.resolve(),refreshId=0;
const replyDrafts=new Map(),replyBusy=new Set(),orderPanels=new Map();
const controls=['mode','tone','volume','interval'];
// Hidden Electron windows may suspend requestAnimationFrame: use a microtask
// after the complete synchronous alert DOM update to acknowledge the revision.
let layoutQueued=false;
function fit(){if(layoutQueued)return;layoutQueued=true;queueMicrotask(()=>{layoutQueued=false;void window.labAlert.layout({height:Math.ceil(document.body.getBoundingClientRect().height),revision:state.revision}).catch(()=>{})})}
function renderDownloads(items){
 // R1913: the ORIGINAL new-order card owns both stages for its lifetime.
 // Progress IPC never creates a second/independent download card.
 state.downloads=Array.isArray(items)?items:[];
 const oldRoot=$('downloads');oldRoot.replaceChildren();oldRoot.hidden=true;
 const digits=value=>String(value??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/^#/,'').trim().replace(/^0+(?=\d)/,'');
 for(const {notice,panel} of orderPanels.values()){
  const id=String(notice.orderId||''),number=digits(notice.orderNumber);
  let item=id?state.downloads.find(p=>p.orderId===id):null;
  if(!item&&!id&&number){
   const matches=state.downloads.filter(p=>digits(p.number)===number&&(!notice.created_at||!p.orderCreatedAt||Math.abs(Date.parse(notice.created_at)-Date.parse(p.orderCreatedAt))<10*60*1000));
   if(matches.length===1)item=matches[0]; // never correlate ambiguous order numbers
  }
  panel.replaceChildren();
  const previouslyComplete=Boolean(notice.completionNote);
  const downloadVerified=previouslyComplete||notice.downloadVerified===true||item?.downloadVerified===true;
  // A generic "complete" or 100% byte progress is NOT proof of an invoice.
  const invoiceDone=previouslyComplete||notice.invoiceIssued===true||item?.invoiceIssued===true||item?.phase==='invoice_issued'||
    (downloadVerified&&item?.phase==='failed'&&['pdf','print'].includes(item.stage));
  const downloadFailed=item?.phase==='failed'&&!downloadVerified;
  const invoiceFailed=item?.phase==='failed'&&downloadVerified&&item.stage==='invoice';
  const phase={checking:'بررسی و تطبیق فایل‌ها',downloading:'در حال دانلود',verified:'دانلود تأیید شد',
   invoice_issuing:'در حال صدور فاکتور',invoice_issued:'فاکتور صادر شد',complete:'سفارش تکمیل شد',failed:'نیازمند بررسی'};
  const failure=item?.stage==='invoice'?'دانلود تأیید شد؛ صدور فاکتور انجام نشد':item?.stage==='pdf'?'فاکتور صادر شد؛ ذخیره PDF انجام نشد':item?.stage==='print'?'فاکتور صادر شد؛ چاپ نیازمند بررسی است':'دانلود کامل نشد؛ نیازمند بررسی';
  const description=previouslyComplete&&!item?'سفارش تکمیل شد':!item&&invoiceDone?'فاکتور صادر شد':!item&&downloadVerified?'دانلود تأیید شد':!item?'در انتظار شروع بررسی و دانلود':
   item.phase==='complete'&&!invoiceDone?'صدور فاکتور هنوز تأیید نشده':
   item.phase==='failed'?failure:invoiceDone&&['checking','downloading','verified','invoice_issuing'].includes(item.phase)?'فاکتور صادر شد':(phase[item.phase]||phase.checking);
  const label=document.createElement('small');label.className='orderStageLabel';
  const showBar=item?.phase==='downloading'&&!downloadVerified&&Number(item.totalBytes)>0;
  label.textContent=(item?.queued?'در صف تلاش مجدد':description)
    +(item?.phase==='failed'&&item.reason?' — '+item.reason:'')
    +(showBar?' · '+Number(item.percent||0).toLocaleString('fa-IR')+'٪':'')
    +(showBar&&item.total?' · '+Number(item.done||0).toLocaleString('fa-IR')+' از '+Number(item.total).toLocaleString('fa-IR')+' فایل':'');
  const checks=document.createElement('div');checks.className='stageChecks';checks.setAttribute('aria-label','وضعیت مستقل دانلود و فاکتور');
  const addCheck=(text,done,failed)=>{const tag=document.createElement('span');tag.className='stageCheck '+(done?'done':failed?'warning':'pending');tag.textContent=(done?'✓ ':failed?'⚠ ':'… ')+text;checks.append(tag)};
  addCheck('دانلود',downloadVerified,downloadFailed);
  addCheck('صدور فاکتور',invoiceDone,invoiceFailed);
  panel.append(label,checks);
  if(item?.networkError){const warning=document.createElement('small');warning.className='orderNetworkWarning';warning.textContent='ارتباط با سرور قطع است؛ فایل‌های ذخیره‌شده محفوظ می‌مانند.';panel.append(warning)}
  if(showBar){const bar=document.createElement('progress');bar.max=100;bar.value=item.percent;bar.setAttribute('aria-label','دانلود سفارش '+(notice.orderNumber||item.number||''));panel.append(bar)}
  if(item?.phase==='failed'&&item.retrySupported){
   const retry=document.createElement('button');retry.type='button';retry.className='retryDownload';
   retry.textContent=item.stage==='invoice'?'تلاش مجدد صدور فاکتور':item.stage==='pdf'?'تلاش مجدد ذخیره فاکتور':item.stage==='print'?'تلاش مجدد چاپ':item.networkError?'ادامهٔ دانلود':'تلاش مجدد دانلود';
   retry.onclick=async()=>{retry.disabled=true;const caption=retry.textContent;retry.textContent='در حال شروع…';
    try{await window.labAlert.retryDownload(item.orderId)}
    catch{status('شروع مجدد انجام نشد؛ برنامه و اتصال اینترنت را بررسی کنید.');retry.disabled=false;retry.textContent=caption}
   };panel.append(retry);
  }
 }
 fit();
}
function status(message){$('status').textContent=message;fit();}
function controlsState(){return {mode:$('mode').value,tone:$('tone').value,volume:Number($('volume').value),interval:Number($('interval').value)}}
function stop(){if(timer)clearInterval(timer);timer=null;context?.suspend().catch(()=>{});}
async function chime(test=false){
 if(!test&&(document.hidden||!state.items.length||state.settings.mode==='silent'))return;
 const settings=test?controlsState():state.settings;
 if(!settings.volume)return;
 try{
  context||=new AudioContext();await context.resume();const now=context.currentTime,frequencies=settings.tone==='beep'?[880]:settings.tone==='soft'?[440,554]:[660,880];
  for(const [i,f] of frequencies.entries()){const osc=context.createOscillator(),gain=context.createGain(),t=now+i*.18;osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(settings.volume/100*.25,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+.55);osc.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+.6)}
 }catch{status('پخش صدا انجام نشد؛ خروجی صدای ویندوز را بررسی کنید.')}
}
function schedule(){if(timer)clearInterval(timer);timer=null;if(!document.hidden&&state.items.length&&state.settings.mode==='repeat')timer=setInterval(()=>void chime(),state.settings.interval*1000)}
function updateControls(){const s=controlsState();$('volumeText').textContent=s.volume.toLocaleString('fa-IR')+'٪';$('intervalRow').hidden=s.mode!=='repeat';fit();}
async function refresh(){
 const id=++refreshId;try{
  await saveChain;const next=await window.labAlert.state();if(id!==refreshId)return;
  const hadItems=state.items.length>0,fresh=next.items.some(x=>!played.has(x.id));state=next;for(const key of replyDrafts.keys())if(!next.items.some(n=>n.id===key))replyDrafts.delete(key);
  for(const name of controls)$(name).value=String(next.settings[name]);updateControls();
  $('title').textContent=state.items.length?state.items.length.toLocaleString('fa-IR')+' اعلان جدید':'تنظیمات صدای اعلان';
  $('hint').textContent=state.items.length?'با «همه را دیدم»، تمام اعلان‌های این پنجره تأیید می‌شوند.':'حتی وقتی پنجرهٔ اصلی بسته است، اعلان سفارش فعال می‌ماند.';
  if(state.settingsOnly)$('preferences').open=true;else if(fresh&&!hadItems)$('preferences').open=false;
  $('orders').hidden=!state.items.length;$('items').replaceChildren();orderPanels.clear();
  for(const n of state.items){const row=document.createElement('div');row.className='order';const title=document.createElement('strong'),body=document.createElement('span');title.textContent=n.title;body.textContent=n.message;row.append(title,body);
   if(n.orderAlert===true){const stagePanel=document.createElement('div');stagePanel.className='orderStage';row.append(stagePanel);orderPanels.set(n.id,{notice:n,panel:stagePanel})}
   if(n.image){const img=document.createElement('img');img.src=n.image;img.alt='عکس پیوست پیام';img.referrerPolicy='no-referrer';img.addEventListener('load',fit);img.addEventListener('error',()=>{img.remove();const hint=document.createElement('small');hint.textContent='عکس دریافت نشد؛ اتصال اینترنت را بررسی کنید.';row.append(hint);fit()});row.append(img)}else if(n.hasAttachment){const hint=document.createElement('small');hint.textContent='این پیام پیوست دارد؛ در گفتگو مشاهده کنید.';row.append(hint)}if(n.replyTo?.customerId){const form=document.createElement('form');form.className='quickReply';const input=document.createElement('textarea');input.rows=2;input.maxLength=4000;input.placeholder='پاسخ به عکاس…';input.setAttribute('aria-label','پاسخ سریع به عکاس');input.value=replyDrafts.get(n.id)||'';input.addEventListener('input',()=>{replyDrafts.set(n.id,input.value);fit()});const send=document.createElement('button');send.type='submit';send.textContent=replyBusy.has(n.id)?'در حال ارسال…':'ارسال پاسخ';send.disabled=input.disabled=replyBusy.has(n.id);form.append(input,send);form.addEventListener('submit',async event=>{event.preventDefault();if(replyBusy.has(n.id)||!input.value.trim())return;replyBusy.add(n.id);replyDrafts.set(n.id,input.value);send.disabled=input.disabled=true;send.textContent='در حال ارسال…';try{await window.labAlert.reply(n.id,input.value);replyDrafts.delete(n.id);status('پاسخ ارسال شد.')}catch(error){status(error?.message||'پاسخ ارسال نشد؛ دوباره تلاش کنید.')}finally{replyBusy.delete(n.id);send.disabled=input.disabled=false;send.textContent='ارسال پاسخ';await refresh()}});row.append(form)}$('items').append(row)}
  if(fresh)$('items').scrollTop=0;
  renderDownloads(next.downloads);
  fit();if(fresh&&!document.hidden){await chime();for(const n of state.items)played.add(n.id)};if(!state.items.length)stop();else schedule();
 }catch{status('دریافت تنظیمات اعلان انجام نشد. دوباره پنجره را باز کنید.')}
}
for(const name of controls)$(name).addEventListener('change',()=>{
 updateControls();const value=controlsState();saveChain=saveChain.catch(()=>{}).then(async()=>{state.settings=await window.labAlert.save(value);status('');if(value.mode==='silent'||value.volume===0)stop();schedule()}).catch(()=>status('تنظیمات ذخیره نشد. دوباره تلاش کنید.'));
});
$('volume').addEventListener('input',updateControls);$('test').onclick=()=>void chime(true);
for(const [button,method] of [['ack','acknowledge'],['open','open']])$(button).onclick=async()=>{
 const ids=state.items.map(x=>x.id);$('ack').disabled=$('open').disabled=true;try{await window.labAlert[method](ids);stop();await refresh()}catch{status('عملیات انجام نشد؛ دوباره تلاش کنید.')}finally{$('ack').disabled=$('open').disabled=false}
};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else void refresh()});
$('preferences').addEventListener('toggle',fit);document.fonts.ready.then(fit);
window.labAlert.onProgress(items=>renderDownloads(items));
window.labAlert.onChange(()=>void refresh());void refresh();
