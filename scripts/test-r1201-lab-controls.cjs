const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const birthday=fs.readFileSync('dist/web/photobridge-lab-birthday-v774.js','utf8');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const finance=ui.slice(ui.indexOf('function db({role:'),ui.indexOf('function lj({section:'));
const actions=ui.slice(ui.indexOf('className:"invoiceActionStack"'),ui.indexOf(']})]},',ui.indexOf('className:"invoiceActionStack"')));
const payment=ui.slice(ui.indexOf('B&&e.jsxs(On,{title:"ثبت دریافت از عکاسی"'),ui.indexOf('ae&&e.jsxs(On,{title:',ui.indexOf('B&&e.jsxs(On,{title:"ثبت دریافت از عکاسی"')));
test('lab invoice row leaves PDF download inside the View modal and no order-files button',()=>{
 assert(finance.includes('t==="lab"?null:e.jsx("button",{disabled:!a.pdf_ready'));
 assert(finance.includes('children:"مشاهده"'));
 assert(!actions.includes('miniOrderFilesBtn'));
 assert(actions.includes('miniCorrectionBtn'));
 assert(actions.includes('externalAccountingBtn'));
 assert(actions.indexOf('miniCorrectionBtn')<actions.indexOf('externalAccountingBtn'));
});
test('payment form uses previously selected customer and no repeated customer selector',()=>{
 assert(!payment.includes('searchPlaceholder:"جستجوی نام عکاسی…"'));
 assert(!payment.includes('placeholder:"انتخاب عکاسی"'));
 assert(payment.includes('value:He.invoiceId'));
 assert(ui.includes('ft({customerId:z||"",invoiceId:"",amount:"",method:"cash",note:""}),L(!0)'));
 assert(ui.includes('disabled:!z,onClick:Ye,children:"＋ ثبت پرداخت"'));
});
test('birthday campaign action is in General settings, no all-settings floating button',()=>{
 assert(ui.includes('className:"pb1201BirthdaySettingsButton"'));
 assert(ui.includes('onClick:()=>window.pb774OpenBirthdayCampaign?.()'));
 assert(birthday.includes('window.pb774OpenBirthdayCampaign=open;'));
 assert(!birthday.includes('setInterval(mount,900);mount();'));
});
test('both photo and album intake display a cancellable, immediate dialog before IO',()=>{
 assert(intake.includes('async function open(mode="print")'));
 assert(intake.includes("const intakeTitle=albumMode?'ثبت سفارش آلبوم حضوری':'ثبت سفارش عکس حضوری'"));
 const shown=intake.indexOf('prep.showModal()');
 // The R1294 intake checks a recently verified primary device first and can
 // request a smaller print-only bootstrap. It must still start only after the
 // immediate cancellable loading dialog is visible.
 const bootstrap=intake.indexOf("const [primary,root,data]=await Promise.all([");
 assert(shown>0&&bootstrap>shown);
 assert(intake.includes("cachedPrimary?Promise.resolve({registered:true,isThisDevice:true}):api('/api/lab/download-device')"));
 assert(intake.includes("api('/api/lab/delegated-orders/bootstrap'+"));
 assert(intake.includes('prep.addEventListener(\'cancel\''));
 assert(intake.includes('if(prepCancelled)return;'));
 assert(intake.includes('prep.remove();opening=false'));
});
test('release includes browser assets and non-global styles',()=>{
 assert(html.includes('/photobridge-r1201-lab-controls.css?v=r1201'));
 assert(/index-UIRefine-v655-r84\.js\?v=[^"]+&lab=r1201"/.test(html));
 assert(fs.readFileSync('dist/web/photobridge-r1201-lab-controls.css','utf8').includes('dialog.pb1201IntakeLoading'));
});
