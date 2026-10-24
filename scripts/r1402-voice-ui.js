function PB1402Voice({api,onSent}){
 const [phase,setPhase]=x.useState('idle'),[clip,setClip]=x.useState(null),[error,setError]=x.useState('');
 const ref=x.useRef({alive:true,recorder:null,stream:null,timer:null,url:null,controller:null});
 x.useEffect(()=>{const st=ref.current;st.alive=true;return()=>{st.alive=false;clearTimeout(st.timer);st.controller?.abort();if(st.recorder?.state==='recording')st.recorder.stop();st.stream?.getTracks().forEach(t=>t.stop());if(st.url)URL.revokeObjectURL(st.url)}},[]);
 const discard=()=>{const st=ref.current;if(st.url)URL.revokeObjectURL(st.url);st.url=null;setClip(null);setPhase('idle');setError('')};
 const start=async()=>{const st=ref.current;setError('');setPhase('permission');try{
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw Error('ضبط صدا در این محیط پشتیبانی نمی‌شود.');
  const mime=['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw Error('فرمت ضبط صدا پشتیبانی نمی‌شود.');
  const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(!st.alive){stream.getTracks().forEach(t=>t.stop());return}st.stream=stream;
  const recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:24000}),chunks=[];let bytes=0;st.recorder=recorder;
  recorder.ondataavailable=ev=>{if(ev.data.size){bytes+=ev.data.size;chunks.push(ev.data);if(bytes>1024*1024&&recorder.state==='recording')recorder.stop()}};
  recorder.onstop=()=>{clearTimeout(st.timer);stream.getTracks().forEach(t=>t.stop());st.stream=null;if(!st.alive)return;if(bytes>1024*1024||!bytes){setError('صدای ضبط‌شده خالی یا بیش از حد مجاز است. دوباره ضبط کنید.');setPhase('idle');return}const blob=new Blob(chunks,{type:mime});st.url=URL.createObjectURL(blob);setClip({blob,url:st.url,mime});setPhase('preview')};
  recorder.onerror=()=>{stream.getTracks().forEach(t=>t.stop());if(st.alive){setError('ضبط صدا انجام نشد.');setPhase('idle')}};
  recorder.start(1000);st.timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop()},120000);setPhase('recording');
 }catch(err){st.stream?.getTracks().forEach(t=>t.stop());if(st.alive){setPhase('idle');setError(err.name==='NotAllowedError'?'اجازهٔ میکروفن داده نشد؛ دسترسی میکروفن را بررسی کنید.':err.message||'ضبط صدا انجام نشد.')}}};
 const send=async()=>{const st=ref.current;if(!clip||phase==='sending')return;setPhase('sending');setError('');const controller=new AbortController();st.controller=controller;let sent=false;try{
  const buffer=new Uint8Array(await clip.blob.arrayBuffer());if(!st.alive)return;let binary='';for(let i=0;i<buffer.length;i+=8192)binary+=String.fromCharCode(...buffer.subarray(i,i+8192));
  const result=await Me(api+'/voice',{method:'POST',signal:controller.signal,body:JSON.stringify({mime:clip.mime,data:btoa(binary)})});if(!st.alive)return;if(!result.message?.id||result.queued)throw Error('ارسال پیام توسط سرور تأیید نشد.');sent=true;discard();
  try{await onSent()}catch{if(st.alive)setError('پیام ارسال شد؛ برای دیدن آن گفتگو را دوباره باز کنید.')}
 }catch(err){if(st.alive&&!sent){setError('صدا ارسال نشد؛ فایل برای تلاش دوباره نگه داشته شد.');setPhase('preview')}}finally{if(st.controller===controller)st.controller=null}};
 return e.jsxs('div',{className:'pb1402Voice',children:[phase==='idle'&&e.jsx('button',{type:'button',onClick:start,'aria-label':'ضبط پیام صوتی',children:'🎙 ضبط صدا'}),phase==='permission'&&e.jsx('span',{role:'status',children:'در انتظار اجازهٔ میکروفن…'}),phase==='recording'&&e.jsxs(e.Fragment,{children:[e.jsx('span',{role:'status',children:'● در حال ضبط · حداکثر ۲ دقیقه'}),e.jsx('button',{type:'button',onClick:()=>ref.current.recorder?.stop(),children:'توقف ضبط'})]}),clip&&e.jsxs(e.Fragment,{children:[e.jsx('audio',{controls:true,src:clip.url,preload:'metadata','aria-label':'پیش‌نمایش پیام صوتی'}),e.jsx('button',{type:'button',disabled:phase==='sending',onClick:send,children:phase==='sending'?'در حال ارسال…':'ارسال صدا'}),e.jsx('button',{type:'button',disabled:phase==='sending',onClick:discard,children:'حذف'})]}),error&&e.jsx('small',{role:'alert',children:error})]});
}
