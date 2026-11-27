// R2082: final Store portal and the existing frozen Windows UI snapshot only.
export function patchPortal(s,helper,css){
 const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R2082 portal anchor '+a.slice(0,100));return s.replace(a,()=>b)};
 if(s.includes('id="pb2082ReaderStyle"'))return s;
 const script='<script id="pbR85AssetScanRuntime">';
 s=once(s,script,css+'\n<script id="pb2082ReaderRuntime">'+helper+'\n</script>\n'+script);
 const start=s.indexOf('async function scanDialog(booking,mode)'),end=s.indexOf('window.pbR85PrintCommitment=',start);
 if(start<0||end<start)throw Error('R2082 pickup bounds');
 let p=s.slice(start,end);
 p=once(p,"let stream=null,closed=false,last='',detector=null,detectBusy=false,allDoneBeeped=false;","let stream=null,closed=false,last='',detector=null,detectBusy=false,allDoneBeeped=false,reader=null,cameraEpoch=0;");
 p=once(p,"done.disabled=mode==='pickup'&&n!==total;","done.disabled=(mode==='pickup'&&n!==total)||Boolean(reader?.busy());");
 p=once(p,"const finish=x=>{if(closed)return;closeSourcePicker(false);closed=true;","const stopCamera=()=>{cameraEpoch++;try{stream?.getTracks().forEach(t=>t.stop())}catch{}stream=null;v.srcObject=null;};\n  const finish=x=>{if(closed)return;closeSourcePicker(false);closed=true;reader?.close();stopCamera();");
 p=once(p,"done.onclick=()=>{if(done.disabled)return;","done.onclick=()=>{if(done.disabled||reader?.busy())return;");
 p=once(p,"try{if(matchMedia('(max-width:700px)').matches){","const cameraWrap=back.querySelector('.pbR85CameraWrap');\n  const showMode=mode=>{stopCamera();cameraWrap.style.display=mode==='camera'?'':'none';err.hidden=true;if(mode==='camera')void startCamera();};\n  const startCamera=async()=>{const token=++cameraEpoch;try{if(!closed&&reader?.mode()==='camera'){");
 p=once(p,"stream=await navigator.mediaDevices.getUserMedia(","const incoming=await navigator.mediaDevices.getUserMedia(");
 p=once(p,"v.srcObject=stream;await v.play();","if(closed||token!==cameraEpoch){incoming.getTracks().forEach(t=>t.stop());return;}stream=incoming;v.srcObject=stream;await v.play();if(closed||token!==cameraEpoch)return;");
 p=once(p,"if(!nativeDetector&&!jsQrReady){","if(closed||token!==cameraEpoch)return;\n  if(!nativeDetector&&!jsQrReady){");
 p=once(p,"const loop=async()=>{if(closed)return;","const loop=async()=>{if(closed||token!==cameraEpoch)return;");
 p=once(p,"if(raw&&raw!==last){","if(!closed&&token===cameraEpoch&&raw&&raw!==last){");
 p=once(p,"}catch(e){state.textContent='دسترسی دوربین فعال نشد.';","}catch(e){if(closed||token!==cameraEpoch)return;state.textContent='دسترسی دوربین فعال نشد.';");
 p=once(p,"همچنان قابل استفاده است.'}\n });}","همچنان قابل استفاده است.'}};\n  reader=window.pb2082QrReader.mount({before:cameraWrap,kind:'pickup',camera:true,onMode:showMode,onCode:async raw=>{const count=codes.size;await add(raw);return codes.size>count||state.textContent;},onPending:pending=>{done.disabled=Boolean(pending)||(mode==='pickup'&&slots.some(s=>!s.scanned));}});\n  showMode(reader.mode());\n });}");
 s=s.slice(0,start)+p+s.slice(end);
 // A versioned URL prevents the old return module from serving from cache.
 const re=/photobridge-r100f73-staff-desktop-return\.js\?[^"'<>\s]+/g;
 if([...s.matchAll(re)].length!==1)throw Error('R2082 return URL');
 return s.replace(re,'photobridge-r100f73-staff-desktop-return.js?v=r2082');
}
export function patchReturn(s){
 if(s.includes('pb2082QrReader.mount'))return s;
 const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R2082 return anchor '+a);s=s.replace(a,()=>b)};
 once("let slots=[],closed=false,missingConfirmed=false,armedSignature='';","let slots=[],closed=false,missingConfirmed=false,armedSignature='',reader=null;");
 once("if(closed)return;closed=true;dialog.remove();","if(closed)return;closed=true;reader?.close();dialog.remove();");
 once("submit.disabled=false;refresh();","submit.disabled=false;refresh();\n          if(!closed&&window.pb2082QrReader)reader=window.pb2082QrReader.mount({before:rows,kind:'return',onCode:raw=>{const match=window.pb2082QrReader.returnMatch(slots,raw);if(!match.slot)return {duplicate:'این واحد قبلاً دریافت شده است.',ambiguous:'این سریال مبهم است؛ QR اختصاصی تجهیز را بخوانید.',not_order:'این تجهیز جزو واحدهای همین سفارش نیست.',invalid:'کد معتبر نیست.'}[match.error];const i=slots.indexOf(match.slot);match.slot.checked=true;const input=rows.querySelector('[data-check=\"'+i+'\"]');if(input)input.checked=true;refresh();return true;},onPending:n=>{submit.disabled=Boolean(n);}});");
 once("if(closed||submit.disabled||!slots.length)return;","if(closed||submit.disabled||reader?.busy()||!slots.length)return;");
 return s;
}