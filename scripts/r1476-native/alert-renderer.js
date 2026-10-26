'use strict';
const $=id=>document.getElementById(id);let state={items:[],settings:{}},timer=null,context=null,played=new Set(),saveChain=Promise.resolve(),refreshId=0;
const replyDrafts=new Map(),replyBusy=new Set();
const controls=['mode','tone','volume','interval'];
function fit(){requestAnimationFrame(()=>void window.labAlert.layout(Math.ceil(document.body.getBoundingClientRect().height)).catch(()=>{}))}
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
  $('orders').hidden=!state.items.length;$('items').replaceChildren();
  for(const n of state.items){const row=document.createElement('div');row.className='order';const title=document.createElement('strong'),body=document.createElement('span');title.textContent=n.title;body.textContent=n.message;row.append(title,body);if(n.image){const img=document.createElement('img');img.src=n.image;img.alt='عکس پیوست پیام';img.referrerPolicy='no-referrer';img.addEventListener('load',fit);img.addEventListener('error',()=>{img.remove();const hint=document.createElement('small');hint.textContent='عکس دریافت نشد؛ اتصال اینترنت را بررسی کنید.';row.append(hint);fit()});row.append(img)}else if(n.hasAttachment){const hint=document.createElement('small');hint.textContent='این پیام پیوست دارد؛ در گفتگو مشاهده کنید.';row.append(hint)}if(n.replyTo?.customerId){const form=document.createElement('form');form.className='quickReply';const input=document.createElement('textarea');input.rows=2;input.maxLength=4000;input.placeholder='پاسخ به عکاس…';input.setAttribute('aria-label','پاسخ سریع به عکاس');input.value=replyDrafts.get(n.id)||'';input.addEventListener('input',()=>{replyDrafts.set(n.id,input.value);fit()});const send=document.createElement('button');send.type='submit';send.textContent=replyBusy.has(n.id)?'در حال ارسال…':'ارسال پاسخ';send.disabled=input.disabled=replyBusy.has(n.id);form.append(input,send);form.addEventListener('submit',async event=>{event.preventDefault();if(replyBusy.has(n.id)||!input.value.trim())return;replyBusy.add(n.id);replyDrafts.set(n.id,input.value);send.disabled=input.disabled=true;send.textContent='در حال ارسال…';try{await window.labAlert.reply(n.id,input.value);replyDrafts.delete(n.id);status('پاسخ ارسال شد.')}catch(error){status(error?.message||'پاسخ ارسال نشد؛ دوباره تلاش کنید.')}finally{replyBusy.delete(n.id);send.disabled=input.disabled=false;send.textContent='ارسال پاسخ';await refresh()}});row.append(form)}$('items').append(row);played.add(n.id)}
  fit();if(fresh)void chime();if(!state.items.length)stop();else schedule();
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
window.labAlert.onChange(()=>void refresh());void refresh();
