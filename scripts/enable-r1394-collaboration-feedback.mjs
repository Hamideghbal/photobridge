import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* R1394 collaboration review feedback */')){
 const start=s.indexOf('y=async(I,T)=>',s.indexOf('function Jj(')),end=s.indexOf(';return e.jsxs',start);
 if(start<0||end<start||!s.slice(start,end).includes('ثبت نتیجه درخواست انجام نشد.'))throw Error('R1394 changed collaboration review handler');
 const replacement=`y=async(I,T)=>{if(T==="reject"&&!confirm(\`درخواست همکاری «\${I.name}» رد شود؟\`))return;m(I.id);try{let k;try{k=await Me(\`/api/lab/collaboration-requests/\${I.id}/\${T}\`,{method:"POST",body:"{}"})}catch(E){const C=E?.data?.error||E?.message||"request_failed",messages={request_not_found:"این درخواست پیدا نشد؛ فهرست را بازخوانی کنید.",request_already_reviewed:"نتیجهٔ این درخواست قبلاً ثبت شده است؛ فهرست را بازخوانی کنید.",lab_admin_customer_role_conflict:"این حساب در همین لابراتوار نقش مدیریتی دارد و نمی‌توان آن را به عضویت عکاس تبدیل کرد.",lab_subscription_expired:"اعتبار لابراتوار پایان یافته است؛ ابتدا اعتبار را تمدید کنید.",lab_suspended:"لابراتوار معلق است؛ برای بررسی با پشتیبانی تماس بگیرید.",forbidden:"اجازهٔ بررسی این درخواست را ندارید؛ با حساب مدیر همین لابراتوار وارد شوید."};alert(messages[C]||("ثبت نتیجه درخواست انجام نشد. کد خطا: "+C+(E?.status?" ("+E.status+")":"")));return}
 const state=T==="approve"?"approved":"rejected";r(previous=>previous?({...previous,requests:(previous.requests||[]).map(item=>item.id===I.id?({...item,status:state}):item)}):previous);
 let refreshFailed=false;try{await g()}catch{refreshFailed=true}try{if(typeof t==="function")await t()}catch{refreshFailed=true}
 const result=T==="approve"?\`همکاری «\${I.name}» فعال شد. نوع تسویه اولیه روی «تسویه قبل از چاپ» قرار گرفت\${Number(k.discountPercent)>0?\` و \${V(k.discountPercent)}٪ تخفیف همکاری اعمال شد\`:""}.\`:\`درخواست همکاری «\${I.name}» رد شد.\`;
 alert(result+(refreshFailed?"\\nنتیجه ثبت شد، اما بازخوانی کامل صفحه انجام نشد؛ صفحه را بازخوانی کنید.":""));
 }finally{m("")}}`;
 s=s.slice(0,start)+replacement+s.slice(end);s+='\n/* R1394 collaboration review feedback */\n';fs.writeFileSync(file,s);
}
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&collaborationReview=')?url:url+'&collaborationReview=r1394');
if(!html.includes('collaborationReview=r1394'))throw Error('R1394 missing website entry');
fs.writeFileSync(htmlFile,html);
