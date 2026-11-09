// R1728 — redesign only the Lab's walk-in photo order customer/account strip.
// Apply after all historical patch stages to both delivered Lab web and native UIs.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const once=(source,old,next,label)=>{
  const count=source.split(old).length-1;
  if(count!==1)throw Error('[R1728] '+label+' anchor count '+count);
  return source.replace(old,next);
};
const cssName='photobridge-r1728-intake-customer-layout.css';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/photobridge-r1137-lab-local-intake.js';
  let src=fs.readFileSync(file,'utf8');
  if(!src.includes('/* PB1728 consolidated pending-invite SMS */')){
    src=once(src,
      " const itemLabel=c=>[c.mobile,c.name!==c.mobile?c.name:null,c.registrationPending?'پیش‌عضویت':'عضویت کامل'].filter(Boolean).join(' · ');",
      " const itemLabel=c=>[c.mobile,c.name!==c.mobile?c.name:null,c.registrationPending?'پیش‌عضویت':'عضویت کامل'].filter(Boolean).join(' · ');\n // R1728: reuse the existing invitation endpoint; never create an invoice SMS for a pending account.\n model.resendPendingInvitation=()=>resendInvitation(model.value);",
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
    if(start<0||end<start||src.indexOf(startAnchor,start+1)!==-1)throw Error('[R1728] pending invitation button section changed');
    src=src.slice(0,start)+"  /* PB1728 consolidated pending-invite SMS: the SMS checkbox replaces the duplicate resend button. */\n"+src.slice(end);
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
        "   /* PB1728 consolidated pending-invite SMS */",
        "   if(customers.registrationPending===true&&customers.sendInvoiceSms===true){",
        "    const invitationStatus=node('p','در حال ارسال پیامک دعوت‌نامه…','pb1367InvoiceSmsResult');",
        "    form.append(invitationStatus);",
        "    void customers.resendPendingInvitation().then(delivery=>{",
        "     if(delivery?.invitationSmsSent!==true)throw Error(delivery?.invitationSmsError||'sms_send_failed');",
        "     invitationStatus.textContent='پیامک دعوت‌نامه عضویت ارسال شد.';",
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
  const cssFile=root+'/'+cssName;
  fs.copyFileSync('scripts/r1728-intake-customer-layout.css',cssFile);
  const htmlPath=root+'/index.html';
  let html=fs.readFileSync(htmlPath,'utf8');
  if(!html.includes(cssName)){
    html=once(html,'</head>','<link rel="stylesheet" href="/'+cssName+'?v=r1728">\n</head>','account CSS link');
  }
  const script=/photobridge-r1137-lab-local-intake\.js\?[^"'\s<>]+/g;
  const hits=[...html.matchAll(script)];
  if(hits.length!==1)throw Error('[R1728] '+root+' intake JS URL count '+hits.length);
  html=html.replace(script,url=>url.includes('accountRow=r1728')?url:url+'&accountRow=r1728');
  fs.writeFileSync(htmlPath,html);
  if(root.endsWith('lab-desktop-ui')){
    const manifestPath=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    if(!Array.isArray(manifest.files)||manifest.channel!=='lab')throw Error('[R1728] unexpected native Lab manifest');
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
console.log('[R1728] Manual photographer selection wraps balance/date below dropdown, and SMS invites pending members after submit.');
