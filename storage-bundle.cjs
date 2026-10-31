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
 if(!source.includes("window.addEventListener('photobridge-lab-orders-changed',refresh)"))throw Error('native_orders_refresh_ui_incompatible');
 if(source.includes('/* PB native disk bridge v1 */'))return source;
 for(const [before] of patches)if(source.split(before).length!==2)throw Error('native_storage_ui_incompatible:'+before);
 for(const [before,after] of patches)source=source.replace(before,after);
 source=source.replace('const V=t=>Number(t||0).toLocaleString("fa-IR")','const V=t=>typeof t==="string"&&/^PB-/.test(t)?t:Number(t||0).toLocaleString("fa-IR")');
 source=source.replace('children:(t==null?void 0:t.name)||"هنوز انتخاب نشده"','children:(t==null?void 0:t.displayPath)||(t==null?void 0:t.name)||"هنوز انتخاب نشده"');
 source=source.replace('e.jsxs("div",{className:"localFolderActions",children:[','e.jsxs("div",{className:"localFolderActions",children:[t&&!(g!=null&&g.isThisDevice)&&e.jsx("button",{disabled:f,onClick:E,children:f?"در حال ثبت…":"ثبت سیستم اصلی"}),');
 source=source.replace('}catch(M){alert((M==null?void 0:M.status)===409?', '}catch(M){p(await Hu().catch(()=>null));alert((M==null?void 0:M.status)===409?');
 source=source.replace('ممکن است مرورگر دوباره اجازه بخواهد','پوشه در دسترس نیست؛ اتصال درایو و مجوز نوشتن را بررسی کنید');
 return '/* PB native disk bridge v1 */\n'+source;
}
module.exports={patchStorageBundle};
