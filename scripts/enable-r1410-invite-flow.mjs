import fs from 'node:fs';
const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1410 changed anchor ('+n+'): '+a.slice(0,85));return s.replace(a,b)};
const tick=String.fromCharCode(96);
const uiPath='dist/web/assets/index-UIRefine-v655-r84.js',marker='/* PB1410 invite flow and status */';
let ui=fs.readFileSync(uiPath,'utf8');
if(!ui.includes(marker)){
 const start=ui.indexOf('function Xl('),end=ui.indexOf('function ',start+15);
 if(start<0||end<start)throw Error('R1410 invite manager missing');
 let form=ui.slice(start,end);
 form=once(form,'[Se,Fe]=x.useState(""),Le=()=>Me("/api/photographer-invites").then(A=>{s(A.invites||[]),','[Se,Fe]=x.useState(""),[pbHistory,pbSetHistory]=x.useState([]),[pbBusy,pbSetBusy]=x.useState(""),Le=()=>Me("/api/photographer-invites").then(A=>{pbSetHistory(Array.isArray(A.smsHistory)?A.smsHistory:[]),s(A.invites||[]),');
 form=once(form,'if(!de)return $("error"),ae("اول کد ثابت دعوت را بساز.");','');
 form=once(form,'inviteId:de.id,previousDebt:D','inviteId:de?.id||"",previousDebt:D');
 form=once(form,'disabled:L||!je||!!(M!=null&&M.previousRelationship&&!w.trim())','disabled:L||!!pbBusy||!!(M!=null&&M.previousRelationship&&!w.trim())');
 form=once(form,':"دعوت‌نامه با موفقیت پیامک شد.")}',':"دعوت‌نامه با موفقیت پیامک شد."),await Le()}');
 form=once(form,'ce==="invite_sms_link_failed"?"ساخت لینک کوتاه دعوت انجام نشد؛ دوباره تلاش کن.":"ارسال پیامک دعوت انجام نشد؛ جزئیات خطا در سرور ثبت شد."','ce==="invite_sms_link_failed"?"ساخت لینک کوتاه دعوت انجام نشد؛ دوباره تلاش کن.":ce==="invite_create_failed"||ce==="invite_not_found"?"ساخت خودکار کد دعوت انجام نشد؛ پایین صفحه «ساخت کد دعوت» را بزن و خطا را بررسی کن.":"ارسال پیامک دعوت انجام نشد؛ جزئیات خطا در سرور ثبت شد."');
 const resend='pbResend=async item=>{if(pbBusy||L||item.joined)return;pbSetBusy(item.mobile);$("");ae("");try{await Me("/api/photographer-invites/send-sms",{method:"POST",body:JSON.stringify({mobile:item.mobile,inviteId:item.inviteId,previousDebt:item.previousDebt??null})});$("success");ae("ارسال مجدد به "+item.mobile+" توسط سامانه پیامک پذیرفته شد؛ تحویل قطعی هنوز تأیید نشده است.");await Le()}catch(err){const code=String(err?.data?.error||"");$("error");ae(code==="service_wallet_insufficient"?"اعتبار کیف پول برای ارسال مجدد کافی نیست.":code==="sms_lab_disabled"?"پیامک‌های لابراتوار غیرفعال است.":code==="already_lab_member"?"این عکاسی قبلاً عضو لابراتوار شده و نیازی به دعوت مجدد ندارد.":code==="sms_provider_rejected"?"سامانه پیامکی ارسال مجدد را نپذیرفت.":"ارسال مجدد انجام نشد؛ "+(code||"خطای ارتباط با سامانه پیامک"))}finally{pbSetBusy("")}},';
 form=once(form,',H=location.pathname.startsWith("/photographer")',','+resend+'H=location.pathname.startsWith("/photographer")');
 const help='!je&&e.jsx("small",{className:"pb1410InviteHelp",children:"هنوز کد دعوت نساخته‌ای؛ با اولین ارسال پیامک، کد ثابت و لینک دعوت به‌صورت خودکار ساخته می‌شود."}),';
 form=once(form,'H==="lab"&&e.jsxs("div",{className:"labPermanentInviteSms",children:[','H==="lab"&&e.jsxs("div",{className:"labPermanentInviteSms",children:['+help);
 const history='e.jsxs("section",{className:"pb1410SmsHistory",children:[e.jsx("b",{children:"پیگیری دعوت‌نامه‌ها"}),pbHistory.length?pbHistory.map((item,index)=>e.jsxs("div",{className:"pb1410SmsRow",children:[e.jsx("span",{dir:"ltr",children:item.mobile}),e.jsx("small",{children:item.joined?"عضو لابراتوار شده":item.lastSentAt?"پذیرفته‌شده توسط سامانه پیامک":"لینک ساخته‌شده؛ ارسال تأیید نشده"}),e.jsx("small",{children:item.lastSentAt?vn(item.lastSentAt):"—"}),!item.joined&&e.jsx("button",{type:"button",className:"pbActionButton compact",disabled:!!pbBusy||L,onClick:()=>pbResend(item),children:pbBusy===item.mobile?"در حال ارسال…":"ارسال مجدد"})]},item.inviteId+":"+item.mobile+":"+index)):e.jsx("small",{children:"هنوز ارسال ثبت‌شده‌ای برای این لابراتوار وجود ندارد."})]}),';
 const statusAnchor='me&&e.jsxs("div",{className:'+tick+'labPermanentInviteSmsNoticeRow '+String.fromCharCode(36)+'{v}'+tick+',children:[';
 form=once(form,statusAnchor,history+statusAnchor);
 ui=ui.slice(0,start)+form+ui.slice(end);
 const badge='e.jsx("span",{className:"accountingConnectionBadge "+(h.accounting_connected?"connected":"disconnected"),children:h.accounting_connected?"✓ متصل به حسابداری":"بدون اتصال حسابداری"})';
 ui=once(ui,','+badge+',',',');
 fs.writeFileSync(uiPath,ui+'\n'+marker+'\n');
}
const apiPath='dist/api/server.js',serverMarker='/* PB1410 scoped SMS history */';
let server=fs.readFileSync(apiPath,'utf8');
if(!server.includes(serverMarker)){
 const from=server.indexOf("if (req.method === 'GET' && url.pathname === '/api/photographer-invites')"),end=server.indexOf("if (req.method === 'PUT' && url.pathname === '/api/admin/photographer-invites/commission')",from);
 if(from<0||end<from)throw Error('R1410 GET invite endpoint missing');
 let route=server.slice(from,end);
 const sql="SELECT link.invite_id,link.mobile,link.last_sent_at,link.previous_debt,EXISTS (SELECT 1 FROM lab_memberships m JOIN users u ON u.id=m.user_id WHERE m.lab_id=$1 AND m.role='customer' AND m.active=true AND right(regexp_replace(COALESCE(u.mobile,''),'[^0-9]','','g'),10)=right(regexp_replace(link.mobile,'[^0-9]','','g'),10)) AS joined FROM photographer_invite_sms_links link WHERE link.lab_id=$1 ORDER BY link.last_sent_at DESC NULLS LAST,link.created_at DESC LIMIT 20";
 const extra='const smsHistory=scope.type==="lab"?await pool.query('+tick+sql+tick+', [scope.labId]).then(q=>q.rows.map(r=>({inviteId:r.invite_id,mobile:r.mobile,lastSentAt:r.last_sent_at,previousDebt:r.previous_debt,joined:Boolean(r.joined)}))).catch(err=>{console.error("[photographer-invite:sms-history-unavailable]",String(err?.code||err?.message||"error"));return []}):[];\n        ';
 route=once(route,'return sendJson(res, 200, { invites: q.rows.map(photographerInvitePublicView)',extra+'return sendJson(res, 200, { invites: q.rows.map(photographerInvitePublicView)');
 route=once(route,', commissionSettings });',', commissionSettings, smsHistory });');
 server=server.slice(0,from)+route+server.slice(end);
 fs.writeFileSync(apiPath,server+'\n'+serverMarker+'\n');
}
const htmlPath='dist/web/index.html';
if(fs.existsSync(htmlPath)){
 let html=fs.readFileSync(htmlPath,'utf8');
 if(!html.includes('/photobridge-r1410-invite.css'))html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1410-invite.css?v=r1410"></head>');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,link=>link.replace(/&inviteFlow=[^&"']*/g,'')+'&inviteFlow=r1410');
 fs.writeFileSync(htmlPath,html);
}
