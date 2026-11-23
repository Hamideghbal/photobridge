/* R1969: personalized A4 walk-in poster. No changes to the existing order flow. */
(()=>{'use strict';
const PANEL='.walkinLinkCard', ID='pbWalkinPosterR1969';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const validHttps=value=>{try{const url=new URL(String(value));return url.protocol==='https:'?url:null}catch{return null}};
async function json(path){const response=await fetch(path,{credentials:'same-origin',headers:{accept:'application/json'},cache:'no-store'});if(!response.ok)throw new Error('api_error');return response.json()}
function getLink(panel){return validHttps(panel.querySelector('.walkinLinkInfo input[readonly]')?.value||panel.querySelector('.walkinLinkInfo input')?.value)}
function documentHtml({labName,walkinUrl,siteUrl}){
 const qr='https://api.qrserver.com/v1/create-qr-code/?size=900x900&margin=24&data='+encodeURIComponent(walkinUrl);
 const name=escapeHtml(labName), site=siteUrl?escapeHtml(siteUrl):'';
 return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>پوستر ارسال عکس - ${name}</title><style>
 @page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;width:210mm;height:297mm}
 body{font-family:Tahoma,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;color:#17324b;background:#fff}
 .page{position:relative;width:210mm;height:297mm;padding:16mm 17mm 13mm;overflow:hidden;background:linear-gradient(175deg,#eafaff 0%,#fff 44%,#f3f9ff 100%)}
 .top{background:#0b3e67;color:white;border-radius:8mm;padding:11mm 10mm 10mm;position:relative}
 .top:after{content:"";position:absolute;width:50mm;height:50mm;background:#1d7396;border-radius:50%;opacity:.3;left:-17mm;top:-26mm}
 .name{font-size:21pt;font-weight:900;line-height:1.6;overflow-wrap:anywhere}
 .eyebrow{font-size:10pt;letter-spacing:.2px;color:#c4ecf5}
 h1{font-size:23pt;line-height:1.65;margin:6mm 0 0;font-weight:900} .intro{font-size:12pt;margin:5mm 0 4mm;line-height:1.9;color:#456078;text-align:center}
 .qrbox{margin:0 auto;text-align:center;background:#fff;border:1.2mm solid #d2e7f1;border-radius:8mm;width:120mm;padding:7mm 4mm 5mm;box-shadow:0 3mm 11mm #183e6014}
 .qrbox img{width:74mm;height:74mm;display:block;margin:auto;image-rendering:auto}
 .qrtitle{font-weight:900;font-size:16pt;margin:3mm 0 0}.steps{display:flex;gap:3mm;margin:7mm auto 0;width:100%;justify-content:center;direction:rtl}
 .step{font-size:10pt;background:#e0f2f8;border-radius:4mm;padding:3mm 4mm;white-space:nowrap;font-weight:bold}
 .alternative{margin-top:8mm;padding:6mm 7mm;border:1px solid #cde0ed;border-radius:6mm;background:#fff}
 .alternateTitle{font-size:14pt;font-weight:900;color:#0b3e67;margin:0 0 3mm}
 .site{direction:ltr;text-align:center;unicode-bidi:plaintext;font:900 15pt Arial,sans-serif;overflow-wrap:anywhere;color:#146788;margin:3mm auto}
 .hint{font-size:10pt;line-height:1.9;text-align:center;color:#50687c;margin:0}
 .footer{position:absolute;bottom:10mm;right:17mm;left:17mm;border-top:1px solid #cfe0e9;padding-top:4mm;text-align:center;font-size:10pt;font-weight:bold;color:#406078}
 .onlyqr .qrbox{margin-top:15mm}.onlyqr .qrbox img{width:86mm;height:86mm}.onlyqr .steps{margin-top:15mm}
 @media print{.page{box-shadow:none}}
 </style></head><body><main class="page ${siteUrl?'':'onlyqr'}">
 <header class="top"><div class="eyebrow">سفارش آنلاین چاپ عکس</div><div class="name">${name}</div><h1>عکس‌هات رو همین‌جا برای چاپ بفرست!</h1></header>
 <p class="intro">بدون نیاز به مراجعه مجدد، عکس‌هایت را از طریق گوشی برای ما ارسال کن.</p>
 <section class="qrbox"><img src="${escapeHtml(qr)}" alt="کد ارسال عکس"><div class="qrtitle">${siteUrl?'روش اول: اسکن کد QR':'اسکن کد QR'}</div><div class="hint">دوربین گوشی را به سمت کد بگیر و وارد صفحه ارسال عکس شو.</div></section>
 <div class="steps"><span class="step">۱. اسکن یا ورود</span><span class="step">۲. انتخاب عکس‌ها</span><span class="step">۳. ثبت سفارش</span></div>
 ${siteUrl?`<section class="alternative"><div class="alternateTitle">روش دوم: از طریق سایت لابراتوار</div><div class="site">${site}</div><p class="hint">آدرس بالا را در مرورگر باز کن، گزینه ارسال یا سفارش عکس را انتخاب کن و عکس‌هایت را بارگذاری و سفارش را ثبت کن.</p></section>`:''}
 <footer>${name} · چاپ عکس با ثبت سفارش آنلاین</footer></main>
 <script>window.addEventListener('load',()=>{const img=document.querySelector('.qrbox img');const go=()=>setTimeout(()=>window.print(),350);if(img.complete)go();else{img.addEventListener('load',go,{once:true});img.addEventListener('error',()=>{document.body.insertAdjacentHTML('afterbegin','<p style="color:red;text-align:center">بارگذاری QR ناموفق بود؛ قبل از چاپ دوباره تلاش کنید.</p>')},{once:true})}});<\/script>
 </body></html>`;
}
async function openPoster(button,panel){
 const url=getLink(panel);if(!url){alert('ابتدا لینک معتبر مشتری آزاد را فعال کنید.');return}
 button.disabled=true;const label=button.textContent;button.textContent='در حال آماده‌سازی پوستر…';
 // Open synchronously on user gesture to avoid popup blockers.
 const popup=window.open('','_blank');if(!popup){button.disabled=false;button.textContent=label;alert('اجازه باز کردن پنجره چاپ را در مرورگر فعال کنید.');return}
 try{
  const state=await json('/api/lab/walkin');const name=String(state?.lab?.name||'').trim();
  if(!name||!state?.url||validHttps(state.url)?.href!==url.href)throw new Error('invalid_walkin_state');
  let site=null;
  try{
   const info=await json('/api/lab/site');
   const domain=Array.isArray(info.domains)?info.domains.find(d=>d.active===true&&/^[a-z0-9.-]+$/i.test(d.hostname||'')):null;
   if(domain)site='https://'+domain.hostname+'/';
  }catch{/* Site feature may be unavailable: never invent a domain. */}
  popup.document.open();popup.document.write(documentHtml({labName:name,walkinUrl:url.href,siteUrl:site}));popup.document.close();
 }catch{popup.close();alert('ساخت پوستر انجام نشد. لطفاً صفحه را تازه‌سازی و دوباره تلاش کنید.')}
 finally{button.disabled=false;button.textContent=label}
}
function attach(){
 if(!location.pathname.startsWith('/lab/'))return;
 const panel=document.querySelector(PANEL);if(!panel||panel.querySelector('#'+ID))return;
 const actions=panel.querySelector('.walkinLinkActions');if(!actions||!getLink(panel))return;
 const button=document.createElement('button');button.id=ID;button.type='button';button.className='pbActionButton secondary';button.textContent='چاپ / ذخیره PDF پوستر A4';button.setAttribute('aria-label','چاپ یا ذخیره PDF پوستر اختصاصی مشتری آزاد');
 button.addEventListener('click',()=>openPoster(button,panel));actions.append(button);
}
let pending=false;const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;attach()})});
function start(){observer.observe(document.body,{childList:true,subtree:true});attach()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();