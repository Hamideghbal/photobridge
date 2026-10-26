import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const once=(text,a,b)=>{if(text.split(a).length!==2)throw Error('R1464 anchor '+a.slice(0,100));return text.replace(a,b)};
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1464 order columns */')){
 const start=ui.indexOf('function Zg('),end=ui.indexOf('function wv(',start);let orders=ui.slice(start,end);
 const recovered='De.recovered_from_order_id&&e.jsx("em",{className:"customerRecoveredOrderBadge",children:"بازگشته از آرشیو"})';
 orders=once(orders,recovered,'null');
 orders=once(orders,'e.jsxs("b",{children:["#",V(De.number)]}),','e.jsxs("b",{children:["#",V(De.number)]}),e.jsxs("div",{className:"pb1464OrderLabels",children:['+recovered+',e.jsx(eo,{status:De.status})]}),');
 orders=once(orders,']}),e.jsx(eo,{status:De.status})]}),e.jsxs("div",{className:"customerOrderFacts"',']})]}),e.jsxs("div",{className:"customerOrderFacts"');
 orders=once(orders,'children:[vn(De.created_at)," · ",De.delivery==="courier"?"پیک":"حضوری"]','children:[vn(De.created_at)," · ",Yi(De.created_at)," · ",De.delivery==="courier"?"پیک":"حضوری"]');
 orders=once(orders,'e.jsxs(Ug,{summary:De.mode===','e.jsxs("div",{className:"pb1464OrderProgress",children:[e.jsx("small",{children:"وضعیت چاپ"}),ft(De)]}),e.jsxs(Ug,{summary:De.mode===');
 ui=ui.slice(0,start)+orders+ui.slice(end);
 const ps=ui.indexOf('function bv('),pe=ui.indexOf('function xv(',ps);let pay=ui.slice(ps,pe);
 pay=once(pay,'prepayOrderCard prepayPaymentCard pricingRequired','prepayOrderCard prepayPaymentCard pb1464Prepay pricingRequired');
 pay=once(pay,'className:"prepayPaidConfirmation"','className:"prepayPaidConfirmation pb1464Prepay"');
 pay=once(pay,'className:"prepayOrderCard prepayPaymentCard "','className:"prepayOrderCard prepayPaymentCard pb1464Prepay "');
 for(const [from,to] of [
 ['در انتظار قیمت‌گذاری لابراتوار','در انتظار تعیین مبلغ'],
 ['حداقل یک سایز این سفارش تعرفه آماده ندارد. فایل‌ها با موفقیت ارسال شده‌اند؛ لابراتوار قیمت واحد را مشخص می‌کند و بعد پیش‌فاکتور برای پرداخت همین‌جا فعال می‌شود.','فایل‌ها دریافت شده‌اند. پس از قیمت‌گذاری لابراتوار، مبلغ و امکان ارسال رسید اینجا نمایش داده می‌شود.'],
 ['رسید در انتظار تأیید لابراتوار','رسید در حال بررسی'],['رسید نیاز به اصلاح دارد','رسید تأیید نشد'],['پرداخت فاکتور قبل از چاپ','پرداخت پیش از چاپ'],
 ['رسیدت ارسال شده است؛ بعد از تأیید لابراتوار سفارش به‌صورت خودکار برای چاپ آزاد می‌شود.','رسید ارسال شده است. پس از تأیید لابراتوار، سفارش برای چاپ آزاد می‌شود.'],
 ['رسید قبلی تأیید نشده؛ اطلاعات واریز را بررسی کن و رسید صحیح را دوباره بفرست.','دلیل رد را بررسی کنید و رسید صحیح را دوباره بفرستید.'],
 ['مبلغ فاکتور را دقیقاً به حساب لابراتوار واریز کن و تصویر رسید را همین‌جا ارسال کن.','مبلغ سفارش را به حساب لابراتوار واریز کنید؛ سپس رسید را برای تأیید بفرستید.'],
 ['children:"₮"','children:"…"']])pay=once(pay,from,to);
 ui=ui.slice(0,ps)+pay+ui.slice(pe)+'\n/* PB1464 order columns */\n';fs.writeFileSync(uiFile,ui);
}
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';let nav=fs.readFileSync(navFile,'utf8');if(!nav.includes('/* PB1464 album third row */')){nav=once(nav,"doc?.querySelector('.pb1461Orders,.simplePrintPilotWorkspaceMode')","doc?.querySelector('.pb1461Orders,.pb1464Album,.simplePrintPilotWorkspaceMode')");nav+='\n/* PB1464 album third row */\n';fs.writeFileSync(navFile,nav)}
const insetFile='dist/web/photobridge-r1318-print-insets.js';let inset=fs.readFileSync(insetFile,'utf8');if(!inset.includes('/* PB1464 intake scroll origin */')){inset=once(inset,"main.photographerPrintWorkspace>.photographerLabContextRail,#pb761-mode-actions", "main.photographerPrintWorkspace>.photographerLabContextRail,main.photographerPrintWorkspace>.simplePrintPilotMobileHeaderHost,#pb761-mode-actions");inset=once(inset,"  if(!document.documentElement.classList.contains('pb1126Embedded'))return 0;\n",'');inset=once(inset,"if(document.documentElement.classList.contains('pb1126Embedded')){const area=", "if(document.documentElement.classList.contains('pb1126Embedded')||document.documentElement.classList.contains('pb1126Desktop')){const area=");inset+='\n/* PB1464 intake scroll origin */\n';fs.writeFileSync(insetFile,inset)}
const iconsFile='dist/web/photobridge-r1163-desktop-gallery-header.js';let icons=fs.readFileSync(iconsFile,'utf8');if(!icons.includes('/* PB1464 native lab icons */')){
 const begin=icons.indexOf(" const svgPower='"),end=icons.indexOf("';",begin)+2;if(begin<0||end<begin)throw Error('R1464 power icon anchor');
 icons=icons.slice(0,begin)+` const svgPower='<svg class="powerLogoutIcon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v8"/><path d="M7.4 5.7a8 8 0 1 0 9.2 0"/></svg>';`+icons.slice(end);
 icons=once(icons,"    button.textContent=kind==='settings'?'⚙':'🔔';",`    if(kind==='settings')button.textContent='⚙';else{
     const source=original.querySelector('.systemNotificationBellIcon');
     if(source)button.append(source.cloneNode(true));else button.innerHTML='<span class="systemNotificationBellIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg></span>';
     const badge=original.querySelector('.systemNotificationBadge');if(badge)button.append(badge.cloneNode(true));button.setAttribute('aria-label',original.getAttribute('aria-label')||'اعلان‌ها');
    }`);
 icons+='\n/* PB1464 native lab icons */\n';fs.writeFileSync(iconsFile,icons);
}
const cssFile='dist/web/photobridge-r1126-desktop-navigation.css';let css=fs.readFileSync(cssFile,'utf8');if(!css.includes('/* PB1464 album layout */')){css+='\n/* PB1464 album layout */\n'+fs.readFileSync('scripts/r1464-photographer-album-layout.css','utf8')+'\n'+fs.readFileSync('scripts/r1464-order-columns.css','utf8');fs.writeFileSync(cssFile,css)}
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(file,'utf8');html=html.replaceAll('downloadRepair=r1462','downloadRepair=r1464');html=html.replace(/((?:photobridge-r1126-desktop-navigation\.(?:js|css)|photobridge-r1318-print-insets\.js|photobridge-r1163-desktop-gallery-header\.js|photobridge-r1461-print-navigation\.js)\?[^"'\s]*)/g,url=>url.includes('albumChrome=r1464')?url:url+'&albumChrome=r1464');fs.writeFileSync(file,html)}
for(const file of [uiFile,navFile,insetFile,iconsFile])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});console.log('[R1464] Shared white Album toolbar, correct intake scrolling, responsive photo cards and native lab icons.');
