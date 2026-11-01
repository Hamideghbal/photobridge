'use strict';
const patches=[
 ['const ai=()=>typeof window.showDirectoryPicker=="function"','const ai=()=>true'],
 ['async function qs(){','async function qs(){return window.pbNativeFolder?await window.pbNativeFolder.root():null;'],
 ['async function no(){','async function no(){if(!window.pbNativeFolder)throw new Error("ارتباط ذخیره‌سازی با برنامه برقرار نشد؛ از منوی کنار ساعت خروج کامل بزنید و برنامه را دوباره باز کنید.");return await window.pbNativeFolder.choose();'],
 ['async function Oy(handle){','async function Oy(handle){if(window.pbNativeFolder&&handle?.__pbNative)return;'],
 ['async function Vs(t){','async function Vs(t){if(window.pbNativeFolder&&t?.__pbNative)return await window.pbNativeFolder.permission(t);'],
 ['async function Hu(){','async function Hu(){if(!window.pbNativeFolder)throw new Error("ارتباط ذخیره‌سازی با برنامه برقرار نشد.");return await window.pbNativeFolder.device();'],
 ['async function vc(t=!1){','async function vc(t=!1){if(!window.pbNativeFolder)throw new Error("ارتباط ذخیره‌سازی با برنامه برقرار نشد.");return await window.pbNativeFolder.register(t);']
];
function patchStorageBundle(source){
 source=require('./live-order-patch.cjs').patchOrderLive(source);
 if(source.includes('/* PB native disk bridge v1 */'))return source;
 for(const [before] of patches)if(source.split(before).length!==2)throw Error('native_storage_ui_incompatible:'+before);
 for(const [before,after] of patches)source=source.replace(before,after);
 const stageStart=source.indexOf('la=(le,nt)=>'),stageEnd=source.indexOf(',Wn=async',stageStart);if(stageStart>=0&&stageEnd>stageStart){const expression=source.slice(stageStart+'la=(le,nt)=>'.length,stageEnd);source=source.slice(0,stageStart)+'la=(le,nt)=>!le.offline_read_only&&('+expression+')'+source.slice(stageEnd);}
 source=source.replace('le.customer_name," ",le.mode===', 'le.customer_name,le.document_authority&&e.jsx("em",{className:"walkinSourceBadge",children:le.document_authority==="shared"?"مشترک · تغییر فقط آنلاین":le.document_authority==="offline"?"مستقل آفلاین":le.document_authority==="transferring"?"در حال انتقال · فقط مشاهده":"نیازمند تطبیق"})," ",le.mode===');
 source=source.replace('const V=t=>Number(t||0).toLocaleString("fa-IR")','const V=t=>typeof t==="string"&&/^(?:PB-|OFF-)/.test(t)?t:Number(t||0).toLocaleString("fa-IR")');
 source=source.replace('children:(t==null?void 0:t.name)||"هنوز انتخاب نشده"','children:(t==null?void 0:t.displayPath)||(t==null?void 0:t.name)||"هنوز انتخاب نشده"');
 source=source.replace('e.jsxs("div",{className:"localFolderActions",children:[','e.jsxs("div",{className:"localFolderActions",children:[t&&!(g!=null&&g.isThisDevice)&&e.jsx("button",{disabled:f,onClick:E,children:f?"در حال ثبت…":"ثبت سیستم اصلی"}),');
 source=source.replace('}catch(M){alert((M==null?void 0:M.status)===409?', '}catch(M){p(await Hu().catch(()=>null));alert((M==null?void 0:M.status)===409?');
 source=source.replace('ممکن است مرورگر دوباره اجازه بخواهد','پوشه در دسترس نیست؛ اتصال درایو و مجوز نوشتن را بررسی کنید');
 return '/* PB native disk bridge v1 */\n'+source;
}
module.exports={patchStorageBundle};
