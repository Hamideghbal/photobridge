// R1740 — minimal post-v2268 Lab intake update; preserve working native order launch.
// Based on the known-good Liara deploy 2268; apply only after existing build stages to both delivered Lab web and native UIs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const once=(source,old,next,label)=>{
  const count=source.split(old).length-1;
  if(count!==1)throw Error('[R1740] '+label+' anchor count '+count);
  return source.replace(old,next);
};
const cssName='photobridge-r1740-intake-customer-layout.css';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/photobridge-r1137-lab-local-intake.js';
  let src=fs.readFileSync(file,'utf8');
  if(!src.includes('/* PB1740 consolidated pending-invite SMS */')){
    src=once(src,
      " const itemLabel=c=>[c.mobile,c.name!==c.mobile?c.name:null,c.registrationPending?'پیش‌عضویت':'عضویت کامل'].filter(Boolean).join(' · ');",
      " const itemLabel=c=>[c.mobile,c.name!==c.mobile?c.name:null,c.registrationPending?'پیش‌عضویت':'عضویت کامل'].filter(Boolean).join(' · ');\n // R1740: reuse the existing invitation endpoint; never create an invoice SMS for a pending account.\n model.resendPendingInvitation=()=>resendInvitation(model.value);",
      'pending invite action');
    // Earlier patch stages customize this checkbox differently in real Liara
    // web and Windows bundles. Apply our state-aware label AFTER any old label
    // assignment. Never match the historical aria-label or tooltip text.
    const smsMount="  smsChoice.append(sms,node('span','پیامک'));controls.append(smsChoice);";
    const smsChange="  sms.onchange=()=>{model.sendInvoiceSms=sms.checked;};";
    const smsAnchor=src.includes(smsMount)?smsMount:smsChange;
    const smsLines=[
      "  sms.setAttribute('aria-label',c.registrationPending?'ارسال پیامک دعوت‌نامه پس از ثبت سفارش':'ارسال پیامک فاکتور همین سفارش');",
      "  smsChoice.title=data.smsEnabled?(c.registrationPending?'پس از ثبت سفارش، پیامک دعوت‌نامه عضویت مجدداً ارسال می‌شود.':'پس از ثبت سفارش، پیامک فاکتور همین سفارش بعد از صدور ارسال می‌شود.'):'ارسال پیامک برای این لابراتوار غیرفعال است';"
    ].join('\n');
    src=once(src,smsAnchor,smsAnchor+'\n'+smsLines,'SMS checkbox mount');
    const startAnchor="  if(c.registrationPending){\n   const resend=node('button','ارسال مجدد دعوت‌نامه','pb1294ResendInvite');";
    const endAnchor="  if(data.canEditInitialDebt){";
    const start=src.indexOf(startAnchor);
    const end=src.indexOf(endAnchor,start);
    if(start<0||end<start||src.indexOf(startAnchor,start+1)!==-1)throw Error('[R1740] pending invitation button section changed');
    src=src.slice(0,start)+"  /* PB1740 consolidated pending-invite SMS: the SMS checkbox replaces the duplicate resend button. */\n"+src.slice(end);
    src=once(src,
      "notice.textContent='مشتری ثبت شد اما پیامک ارسال نشد: '+(code==='invitation_sms_rate_limited'?'یک دقیقه دیگر روی «ارسال مجدد دعوت‌نامه» بزنید.':code)+'. برای ارسال مجدد، مشتری را انتخاب کنید.';",
      "notice.textContent='مشتری ثبت شد اما پیامک ارسال نشد: '+(code==='invitation_sms_rate_limited'?'یک دقیقه دیگر دوباره تلاش کنید.':code)+'. هنگام ثبت سفارش بعدی، گزینه «پیامک» را برای ارسال دعوت‌نامه فعال کنید.';",
      'prereg SMS failure notice');
    src=once(src,
      "const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{sendInvoiceSms:customers.sendInvoiceSms===true});",
      "const result=await api('/api/lab/delegated-orders/'+order.orderId+'/submit',{sendInvoiceSms:customers.sendInvoiceSms===true&&!customers.registrationPending});",
      'avoid duplicate pending-account invoice SMS');
    src=once(src,
      "   const smsResult=result.invoiceSms;",
      [
        "   /* PB1740 consolidated pending-invite SMS */",
        "   if(customers.registrationPending===true&&customers.sendInvoiceSms===true){",
        "    const invitationStatus=node('p','در حال ارسال پیامک دعوت‌نامه عضویت برای مشاهده فاکتور پس از صدور…','pb1367InvoiceSmsResult');",
        "    form.append(invitationStatus);",
        "    void customers.resendPendingInvitation().then(delivery=>{",
        "     if(delivery?.invitationSmsSent!==true)throw Error(delivery?.invitationSmsError||'sms_send_failed');",
        "     invitationStatus.textContent='پیامک دعوت‌نامه عضویت ارسال شد؛ مشتری برای مشاهده فاکتور پس از صدور باید عضویت را تکمیل کند.';",
        "    }).catch(err=>{",
        "     const code=String(err?.message||'sms_send_failed');",
        "     invitationStatus.textContent='سفارش ثبت شد؛ اما پیامک دعوت‌نامه ارسال نشد: '+(code==='invitation_sms_rate_limited'?'برای جلوگیری از ارسال تکراری، یک دقیقه دیگر تلاش کنید.':code==='sms_not_configured'?'سامانه پیامک تنظیم نیست.':code==='invalid_sms_mobile'?'شماره موبایل معتبر نیست.':'دوباره تلاش کنید.');",
        "    });",
        "   }",
        "   const smsResult=result.invoiceSms;"
      ].join('\n'),
      'post-order invitation SMS');
    fs.writeFileSync(file,src);
  }
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  // R1741: keep the real v2268 launcher, including approved callbacks
  // rewritten by earlier native steps (onclick=()=>open(...) etc).
  // Check the actual local launcher rather than one old literal spelling.
  const launchAnchors=['function mount(){',"button.id='pb1137LocalIntakeButton'","/api/lab/download-device"];
  for(const a of launchAnchors)if(!src.includes(a))throw Error('[R1741] intake launcher missing: '+a);
  const launchAt=src.indexOf("button.id='pb1137LocalIntakeButton'");
  const launchCode=src.slice(Math.max(0,launchAt-500),launchAt+1600);
  if(!/\bbutton\.(?:onclick\s*=|addEventListener\s*\(\s*['"]click['"])/.test(launchCode))
    throw Error('[R1741] native intake launcher exists but lacks a click handler');
  const cssFile=root+'/'+cssName;
  fs.copyFileSync('scripts/r1740-intake-customer-layout.css',cssFile);
  const htmlPath=root+'/index.html';
  let html=fs.readFileSync(htmlPath,'utf8');
  if(!html.includes(cssName)){
    html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r1740">\n</head>','account CSS link');
  }
  const script=/photobridge-r1137-lab-local-intake\.js\?[^"'\s<>]+/g;
  const hits=[...html.matchAll(script)];
  if(hits.length!==1)throw Error('[R1740] '+root+' intake JS URL count '+hits.length);
  html=html.replace(script,url=>url.includes('accountRow=r1740')?url:url+'&accountRow=r1740');
  fs.writeFileSync(htmlPath,html);
  if(root.endsWith('lab-desktop-ui')){
    const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    if(!Array.isArray(manifest.files)||manifest.channel!=='lab')throw Error('[R1740] unexpected native Lab manifest');
    for(const name of ['photobridge-r1137-lab-local-intake.js',cssName,'index.html']){
      let entry=manifest.files.find(x=>x.name===name);
      if(!entry){entry={name,url:'/lab-desktop-ui/'+name};manifest.files.push(entry)}
      entry.sha256=hash(fs.readFileSync(root+'/'+name));
    }
    manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
    manifest.build=hash(JSON.stringify(manifest.files));
    manifest.generatedAt=new Date().toISOString();
    fs.writeFileSync(manifestPath,JSON.stringify(manifest));
  }
}
console.log('[R1740] Keep one or two intake rows; invite pending customers only after successful order submit; preserve native launcher.');
