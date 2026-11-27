// R2089: patch only website Store assets after R2082 and R2087.
export function patchPortal(s,helper,css){
 if(s.includes('id="pb2089MobileScanRuntime"'))return s;
 const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R2089 portal anchor '+a.slice(0,100));s=s.replace(a,()=>b)};
 once('<script id="pbR85AssetScanRuntime">',css+'\n<script id="pb2089MobileScanRuntime">'+helper+'\n</script>\n<script id="pbR85AssetScanRuntime">');
 const start=s.indexOf('async function scanDialog(booking,mode)'),end=s.indexOf('window.pbR85PrintCommitment=',start);
 if(start<0||end<start)throw Error('R2089 pickup boundary');
 let p=s.slice(start,end);
 const change=(a,b)=>{if(p.split(a).length!==2)throw Error('R2089 pickup anchor '+a.slice(0,100));p=p.replace(a,()=>b)};
 change("document.body.append(back);","document.body.append(back);const mobileScan=window.pb2089Camera.mobile();if(mobileScan){back.classList.add('pb2089MobilePickup');const hint=back.querySelector('.pbR85ScanHead p');if(hint)hint.remove();back.querySelector('.pbR85ScanHead h2').textContent='تحویل تجهیزات';}");
 change("reader=null,cameraEpoch=0;","reader=null,cameraEpoch=0,mobileCamera=null,cameraPending=false;");
 change("const stopCamera=()=>{cameraEpoch++;","const stopCamera=()=>{mobileCamera?.stop();cameraEpoch++;");
 change("done.disabled=(mode==='pickup'&&n!==total)||Boolean(reader?.busy());","done.disabled=(mode==='pickup'&&n!==total)||Boolean(reader?.busy())||cameraPending;");
 change("if(done.disabled||reader?.busy())return;","if(done.disabled||reader?.busy()||cameraPending)return;");
 change("const startCamera=async()=>{const token=++cameraEpoch;","const startCamera=async()=>{if(mobileScan){mobileCamera??=window.pb2089Camera.mount({wrap:cameraWrap,video:v,canvas,state,onError:msg=>{err.hidden=!msg;err.textContent=msg},onCode:async raw=>{if(closed||cameraPending||reader?.busy())return;cameraPending=true;done.disabled=true;try{await add(raw,null,true)}finally{cameraPending=false;if(!closed)done.disabled=Boolean(reader?.busy())||(mode==='pickup'&&slots.some(s=>!s.scanned));}}});await mobileCamera.start();return;}const token=++cameraEpoch;");
 change("done.disabled=Boolean(pending)||(mode==='pickup'&&slots.some(s=>!s.scanned));","done.disabled=Boolean(pending)||cameraPending||(mode==='pickup'&&slots.some(s=>!s.scanned));");
 change("onCode:async raw=>{const count=codes.size;await add(raw,null,true);return codes.size>count||state.textContent;}","onCode:async raw=>{if(mobileScan&&cameraPending)return 'در حال بررسی اسکن؛ دوباره ثبت کنید.';const count=codes.size;await add(raw,null,true);return codes.size>count||state.textContent;}");
 // On mobile, retain only the equipment name, code and concise status.
 change("else detail='منتظر اسکن یا ورود دستی کد';","else detail='منتظر اسکن یا ورود دستی کد';if(mobileScan){detail=s.scanned?(s.isSupplied?(s.externalCode||'تأمین‌شده'):(s.asset?.system_code||'')):s.isSupplied?'تأمین بیرونی':mode==='return'&&s.expected?(s.expected.system_code||''):'';detail=escHtml(detail);}");
 change("progress.textContent=\u0060\u0024{n} از \u0024{total} واحد تأیید شده\u0024{suppliedCount()?\u0060 · \u0024{suppliedCount()} واحد تأمین بیرونی\u0060:''}\u0060;","progress.textContent=mobileScan?n+' / '+total: \u0060\u0024{n} از \u0024{total} واحد تأیید شده\u0024{suppliedCount()?\u0060 · \u0024{suppliedCount()} واحد تأمین بیرونی\u0060:''}\u0060;");
 // Keep typed manual identifiers across the legacy list rebuild on successful scans.
 change("const render=()=>{closeSourcePicker(false);host.innerHTML=","const render=()=>{closeSourcePicker(false);const draft=mobileScan?new Map([...host.querySelectorAll('[data-slot-input]')].map(el=>[el.dataset.slotInput,el.value])):null;const scroll=host.scrollTop;host.innerHTML=");
 change("host.querySelectorAll('[data-slot-source-open]').forEach","if(draft){for(const input of host.querySelectorAll('[data-slot-input]')){const slot=slots[Number(input.dataset.slotInput)];if(slot&&!slot.scanned&&draft.has(input.dataset.slotInput))input.value=draft.get(input.dataset.slotInput)}host.scrollTop=scroll;}host.querySelectorAll('[data-slot-source-open]').forEach");
 s=s.slice(0,start)+p+s.slice(end);
 once('photobridge-r100f73-staff-desktop-return.js?v=r2082','photobridge-r100f73-staff-desktop-return.js?v=r2082&mobileCamera=r2092');
 return s;
}
export function patchReturn(s){
 if(s.includes('/* PB2089 mobile return camera */'))return s;
 const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R2089 return anchor '+a.slice(0,100));s=s.replace(a,()=>b)};
 once("document.body.appendChild(dialog);","document.body.appendChild(dialog);\n      /* PB2089 mobile return camera */\n      const mobileScan=Boolean(window.pb2089Camera?.mobile());if(mobileScan){dialog.classList.add('pb2089MobileReturn');const hint=dialog.querySelector('.pbR100F73ReturnHead p');if(hint)hint.remove();}");
 once("armedSignature='',reader=null;","armedSignature='',reader=null,camera=null,cameraWrap=null;");
 once("closed=true;reader?.close();dialog.remove();","closed=true;reader?.close();camera?.stop();dialog.remove();");
 once("summary.textContent=fa(count.checked)+' از '+fa(slots.length)+' واحد دریافت شد؛ '+","summary.textContent=mobileScan?fa(count.checked)+' / '+fa(slots.length):fa(count.checked)+' از '+fa(slots.length)+' واحد دریافت شد؛ '+");
 once("const subtitle=slot.isExternal?'واحد تأمین بیرونی / بدون کد سیستمی':","const subtitle=mobileScan?(slot.isExternal?'تأمین بیرونی':slot.code):slot.isExternal?'واحد تأمین بیرونی / بدون کد سیستمی':");
 const start=s.indexOf("if(!closed&&window.pb2082QrReader)reader=window.pb2082QrReader.mount("),end=s.indexOf("\n        }catch(ex)",start);
 if(start<0||end<start)throw Error('R2089 return reader bounds');
 const prior=s.slice(start,end);
 if(!prior.includes('returnMatch(slots,raw)'))throw Error('R2089 return validation missing');
 const replacement=[
 "if(!closed&&window.pb2082QrReader){",
 " const accept=raw=>{const match=window.pb2082QrReader.returnMatch(slots,raw);if(!match.slot)return {duplicate:'این واحد قبلاً دریافت شده است.',ambiguous:'این سریال مبهم است؛ QR اختصاصی تجهیز را بخوانید.',not_order:'این تجهیز جزو واحدهای همین سفارش نیست.',invalid:'کد معتبر نیست.'}[match.error];const i=slots.indexOf(match.slot);match.slot.checked=true;const input=rows.querySelector('[data-check=\"'+i+'\"]');if(input)input.checked=true;refresh();return true;};",
 " if(mobileScan){cameraWrap=document.createElement('div');cameraWrap.className='pbR85CameraWrap';cameraWrap.hidden=true;cameraWrap.innerHTML='<video playsinline muted autoplay></video><canvas></canvas><div class=\"pbR85Guide\"></div><div class=\"pbR85ScanState\" role=\"status\"></div>';rows.before(cameraWrap);const state=cameraWrap.querySelector('.pbR85ScanState');const feedback=message=>{state.textContent=message};camera=window.pb2089Camera.mount({wrap:cameraWrap,video:cameraWrap.querySelector('video'),canvas:cameraWrap.querySelector('canvas'),state,onError:message=>{if(message)feedback(message)},onCode:raw=>{if(closed)return;const result=accept(raw);feedback(result===true?'✓ تجهیز دریافت شد؛ آماده اسکن بعدی':result);try{if(result===true)navigator.vibrate?.(40)}catch{}return result}});}",
 " const modeChanged=mode=>{if(!camera)return;cameraWrap.hidden=mode!=='camera';if(mode==='camera')void camera.start();else camera.stop()};",
 " reader=window.pb2082QrReader.mount({before:cameraWrap||rows,kind:'return',camera:mobileScan,onMode:modeChanged,onCode:accept,onPending:n=>{submit.disabled=Boolean(n);}});",
 " modeChanged(reader.mode());",
 "}"
 ].join('\n');
 s=s.slice(0,start)+replacement+s.slice(end);
 return s;
}
