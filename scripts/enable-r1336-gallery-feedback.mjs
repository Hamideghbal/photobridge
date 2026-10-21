import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
// The explanation is a full-width first row; both controls share the next row.
const notice="E.size>0&&e.jsx(\"small\",{role:\"status\",children:\"عکس‌هایی برای اصلاح انتخاب شده‌اند؛ برای ادامه، درخواست اصلاح را ارسال کن. تأیید نهایی پس از برداشتن تیک‌های اصلاح فعال می‌شود.\"})";
s=s.replace('className:"clientGalleryApprovalActions",children:[','className:"clientGalleryApprovalActions pb1336ApprovalActions",children:[');
if(!s.includes('className:"clientGalleryApprovalActions pb1336ApprovalActions",children:['))throw Error("R1336 approval target missing");
s=s.replaceAll(notice+",","").replace('className:"clientGalleryApprovalActions pb1336ApprovalActions",children:[','className:"clientGalleryApprovalActions pb1336ApprovalActions",children:['+notice+",");
const old='className:"clientGalleryOrderState",children:Ec(L.current_order_status)',next='className:"clientGalleryOrderState"+(Number(L.pending_revision_count)>0&&L.current_order_status==="retouching"?" pb1336NeedsRevision":""),children:Number(L.pending_revision_count)>0&&L.current_order_status==="retouching"?"درخواست اصلاح مشتری · "+V(L.pending_revision_count)+" عکس":Ec(L.current_order_status)';
if(s.includes(old))s=s.replace(old,next);else if(!s.includes(next))throw Error('R1336 card target missing');
const marker='function W0(){',pos=s.indexOf(marker),end=s.indexOf('const T=async()=>',pos);
if(!s.includes('pb1336GalleryRefresh')){
 if(pos<0||end<0)throw Error('R1336 gallery refresh target missing');
 const effect='x.useEffect(()=>{let active=true;const pb1336GalleryRefresh=()=>{if(active&&document.visibilityState!=="hidden")y().catch(()=>{})};const timer=window.setInterval(pb1336GalleryRefresh,10000);window.addEventListener("focus",pb1336GalleryRefresh);document.addEventListener("visibilitychange",pb1336GalleryRefresh);navigator.serviceWorker?.addEventListener?.("message",pb1336GalleryRefresh);return()=>{active=false;window.clearInterval(timer);window.removeEventListener("focus",pb1336GalleryRefresh);document.removeEventListener("visibilitychange",pb1336GalleryRefresh);navigator.serviceWorker?.removeEventListener?.("message",pb1336GalleryRefresh)}},[]);';
 s=s.slice(0,end)+effect+s.slice(end);
}
fs.writeFileSync(file,s);
const css='dist/web/photobridge-r1332-gallery-cards.css';let style=fs.readFileSync(css,'utf8');if(!style.includes('/* R1336'))style+='\n/* R1336 customer retouch feedback */\n.clientGalleryApprovalActions.pb1336ApprovalActions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;direction:rtl}.pb1336ApprovalActions>small{grid-column:1/-1;display:block;font:inherit;font-size:13px;line-height:1.9;color:#475467;text-align:right}.pb1336ApprovalActions>button{appearance:none;min-width:0;min-height:44px;padding:10px 12px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#344054;font:inherit;font-weight:700;cursor:pointer;box-shadow:none}.pb1336ApprovalActions>button.primary{background:#315efb;color:#fff;border-color:#315efb}.pb1336ApprovalActions>button:disabled{opacity:.4!important;cursor:not-allowed!important;box-shadow:none!important}.clientGalleryCard .clientGalleryOrderState.pb1336NeedsRevision{color:#b42318!important;background:#fff1f0!important;border:1px solid #fecdca;font-weight:700}\n';fs.writeFileSync(css,style);
// Existing final release step copies and checksums these shared files.
for(const channel of ['desktop-ui','lab-desktop-ui']){const target=`dist/web/${channel}/assets/index-UIRefine-v655-r84.js`;if(fs.existsSync(target))fs.copyFileSync(file,target);const dest=`dist/web/${channel}/photobridge-r1332-gallery-cards.css`;if(fs.existsSync(dest))fs.copyFileSync(css,dest);}
console.log('[R1336] Retouch feedback layout, correction badges and live card refresh.');
