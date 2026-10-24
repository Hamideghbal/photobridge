import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1391 changed anchor: '+a.slice(0,80));return s.replace(a,b)};
const api='dist/api/server.js';let server=fs.readFileSync(api,'utf8');
if(!server.includes('/* R1391 existing account trial */')){
 const start=server.indexOf("    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial') {"),end=server.indexOf("    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial/verify') {",start);if(start<0||end<start)throw Error('R1391 trial route missing');let route=server.slice(start,end);
 route=once(route,"        if (password.length < 8)\n            return sendJson(res, 400, { error: 'password_too_short' });",'        /* R1391 existing account trial */');
 route=once(route,'        if (existing) {',"        if (!existing && password.length < 8)\n            return sendJson(res, 400, { error: 'password_too_short' });\n        if (existing) {");server=server.slice(0,start)+route+server.slice(end);fs.writeFileSync(api,server);
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(bundle,'utf8');
if(!ui.includes('/* R1391 existing-account trial feedback */')){
 const start=ui.indexOf('function u0(){'),end=ui.indexOf('function ',start+10);if(start<0||end<start)throw Error('R1391 trial component missing');let form=ui.slice(start,end);
 form=once(form,'S=C=>C==="duplicate_mobile"?', 'S=C=>C==="existing_account_password_invalid"?"این شماره حساب PhotoBridge دارد. رمز همان حساب عکاس را در هر دو کادر وارد کن؛ رمز جدید نساز. اگر رمز را فراموش کرده‌ای، از صفحهٔ ورود بازیابی رمز را انجام بده.":C==="lab_admin_already_exists"?"این شماره هنوز مدیر یک لابراتوار است؛ از صفحهٔ ورود لابراتوار وارد شو یا حذف نقش قبلی را در پنل ادمین بررسی کن.":C==="mobile_ambiguous"?"برای این شماره چند حساب سازگار پیدا شد؛ پشتیبانی باید حساب‌ها را بررسی کند. حساب عکاس را حذف نکن.":C==="existing_account_invalid"?"وضعیت حساب موجود تغییر کرده است؛ دوباره وارد حساب شو و ثبت‌نام را تکرار کن.":C==="duplicate_mobile"?');
 form=once(form,'if(t.password.length<8){m("رمز عبور باید حداقل ۸ کاراکتر باشد.");return}','if(!t.password){m("رمز عبور را وارد کن.");return}');
 const alert='c&&e.jsx("div",{className:"alert error",children:c})';
 form=once(form,alert,'e.jsx("p",{className:"authExistingAccountHint",children:"اگر این شماره حساب عکاس یا فروشگاه دارد، رمز همان حساب را در هر دو کادر وارد کن. حساب و اطلاعات قبلی حفظ می‌شوند. برای شمارهٔ جدید، رمز باید حداقل ۸ کاراکتر باشد."}),'+alert);
 ui=ui.slice(0,start)+form+ui.slice(end)+'\n/* R1391 existing-account trial feedback */\n';fs.writeFileSync(bundle,ui);
}
const index='dist/web/index.html';if(fs.existsSync(index)){let html=fs.readFileSync(index,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&labTrial=[^&"']*/g,'')+'&labTrial=r1391');fs.writeFileSync(index,html)}
