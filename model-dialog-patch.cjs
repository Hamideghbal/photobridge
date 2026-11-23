'use strict';
const shell="/* PB1970: editable model fields stay in the browser's active modal layer. */\nfunction PB1970ModelDialogShell({title,onClose,busy=false,children}){\n const ref=x.useRef(null),closeRef=x.useRef(onClose);closeRef.current=onClose;\n x.useEffect(()=>{\n  const dialog=ref.current;if(!dialog)return;\n  dialog.showModal();\n  const frame=requestAnimationFrame(()=>{const input=dialog.querySelector('input:not(:disabled),button:not(:disabled)');input?.focus();});\n  return()=>{cancelAnimationFrame(frame);if(dialog.open)dialog.close();};\n },[]);\n return ra.createPortal(e.jsxs('dialog',{ref,className:'modal card pb1970ModelDialog',dir:'rtl','aria-label':title,onKeyDown:event=>{if(event.key==='Escape')event.stopPropagation();},onCancel:event=>{event.preventDefault();if(!busy)closeRef.current?.();},onMouseDown:event=>{if(!busy&&event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeRef.current?.();}},children:[\n  e.jsxs('div',{className:'panelHead modalHead',children:[e.jsx('h2',{children:title}),e.jsx('button',{type:'button',disabled:busy,'aria-label':'بستن',onClick:()=>closeRef.current?.(),children:'×'})]}),\n  e.jsx('div',{className:'modalContent',children})\n ]}),document.body);\n}\n",css="/* PB1970: a real modal owns keyboard focus even above another native dialog. */\nhtml body dialog.pb1970ModelDialog{display:block;box-sizing:border-box;width:min(560px,calc(100vw - 28px));max-width:calc(100vw - 28px);max-height:calc(100dvh - 32px);margin:auto;padding:0;border:1px solid #d8e2f0;border-radius:20px;background:#fff;color:#20324e;overflow:auto;box-shadow:0 24px 80px #132b4f55;font:14px/1.8 Vazirmatn,Tahoma,sans-serif;direction:rtl;text-align:right}\nhtml body dialog.pb1970ModelDialog:not([open]){display:none}\nhtml body dialog.pb1970ModelDialog::backdrop{background:#142d4d8c;backdrop-filter:blur(4px)}\nhtml body dialog.pb1970ModelDialog .modalHead{padding:16px 20px;border-bottom:1px solid #e5ebf5}\nhtml body dialog.pb1970ModelDialog .modalHead h2{font-size:18px;margin:0}\nhtml body dialog.pb1970ModelDialog .modalContent{padding:20px}\nhtml body dialog.pb1970ModelDialog input{pointer-events:auto;-webkit-user-select:text;user-select:text;-webkit-app-region:no-drag}\n";
function patchModelDialogs(source){
 if(source.includes('/* PB1970: editable model fields'))return source;
 for(const name of ['PB1791ModelNameDialog','PB1777FrameModelEditor']){
  const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+10);
  if(start<0)continue;
  if(end<0)throw Error('native_model_dialog_incompatible:'+name);
  let part=source.slice(start,end);
  for(const [before,after] of [['return e.jsx(On,{','return e.jsx(PB1970ModelDialogShell,{'],[',onClose,children:',',onClose,busy,children:']]){
   if(part.split(before).length!==2)throw Error('native_model_dialog_anchor:'+name);
   part=part.replace(before,after);
  }
  source=source.slice(0,start)+part+source.slice(end);
 }
 return source+'\n'+shell+'\nif(typeof document!=="undefined"&&!document.getElementById("pb1970ModelCss")){const style=document.createElement("style");style.id="pb1970ModelCss";style.textContent='+JSON.stringify(css)+';document.head.append(style);};';
}
module.exports={patchModelDialogs};
