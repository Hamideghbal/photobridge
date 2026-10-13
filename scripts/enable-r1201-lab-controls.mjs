// R1201: responsive walk-in dialogs and nonduplicated lab finance/settings controls.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

function once(text, before, after, label) {
  const count=text.split(before).length-1;
  if (count === 0 && text.includes(after)) return text;
  if (count !== 1) throw Error('[R1201] '+label+': expected once, got '+count);
  return text.replace(before,after);
}
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('pb1201BirthdaySettingsButton')) {
  // Show only the original "مشاهده" action; it already contains PDF download.
  const oldPdf='e.jsx("button",{disabled:!a.pdf_ready||s,onClick:c,children:a.pdf_ready?s?"…":"دانلود PDF":"PDF در حال ساخت"})';
  ui=once(ui,oldPdf,'t==="lab"?null:'+oldPdf,'lab-only duplicate invoice download');
  // Remove a repeated customer selector: payment state is initialized from the
  // already-selected customer in statement (Ye reads z), and actions require z.
  const pickerStart=ui.indexOf('e.jsxs("label",{children:["عکاسی",e.jsx(wn,{searchable:!0,searchPlaceholder:"جستجوی نام عکاسی…"');
  const pickerEnd=ui.indexOf('e.jsxs("label",{children:["فاکتور (اختیاری)"',pickerStart);
  if(pickerStart<0||pickerEnd-pickerStart<350||pickerEnd-pickerStart>650) throw Error('[R1201] payment customer selector changed');
  ui=ui.slice(0,pickerStart)+ui.slice(pickerEnd);
  // Keep "ثبت در حسابداری" intact but put it last; keep existing correction action.
  const stackStart=ui.indexOf('e.jsxs("div",{className:"invoiceActionStack",children:[');
  const stackEnd=ui.indexOf(']})]},',stackStart);
  if(stackStart<0||stackEnd<stackStart||stackEnd-stackStart>1600)throw Error('[R1201] invoice actions changed');
  let actions=ui.slice(stackStart,stackEnd);
  function cutAction(startMarker,label) {
    const a=actions.indexOf(startMarker),b=a<0?-1:actions.indexOf('," ",',a);
    if(a<0||b<0||b-a>480)throw Error('[R1201] '+label+' action changed');
    const action=actions.slice(a,b);
    actions=actions.slice(0,a)+actions.slice(b+5);
    return action;
  }
  const accounting=cutAction('t==="lab"&&!Ot&&!At&&e.jsx("button",{className:"externalAccountingBtn "', 'accounting marker');
  cutAction('t==="lab"&&!Ot&&!At&&Je.order_id&&e.jsx("button",{className:"miniOrderFilesBtn"', 'order-files');
  actions+='," ",'+accounting;
  ui=ui.slice(0,stackStart)+actions+ui.slice(stackEnd);
  // Native React element in General settings, not a floating button everywhere.
  const generalAnchor='e.jsx("p",{children:"تنظیمات تجربه روزانه اپراتور."})]})}),e.jsxs("div",{className:"settingRows"';
  const generalNew='e.jsx("p",{children:"تنظیمات تجربه روزانه اپراتور."})]})}),e.jsx("button",{type:"button",className:"pb1201BirthdaySettingsButton",onClick:()=>window.pb774OpenBirthdayCampaign?.(),children:"🎂 پیام و هدیه تولد عکاس‌ها"}),e.jsxs("div",{className:"settingRows"';
  ui=once(ui,generalAnchor,generalNew,'birthday shortcut in general settings');
  fs.writeFileSync(uiFile,ui);
}
const birthdayFile='dist/web/photobridge-lab-birthday-v774.js';
let birthday=fs.readFileSync(birthdayFile,'utf8');
birthday=once(birthday,'setInterval(mount,900);mount();','window.pb774OpenBirthdayCampaign=open;','remove all-settings floating birthday entry');
fs.writeFileSync(birthdayFile,birthday);

// The old handler awaited three IO calls *before* opening any dialog. React
// cannot show click feedback in that interval. Render a cancellable dialog
// immediately and replace it with the real form after bootstrap resolves.
const intakeFile='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakeFile,'utf8');
if(!intake.includes('pb1201IntakeLoading')) {
  if(!intake.includes('async function open(mode="print")') || !intake.includes("const intakeTitle=albumMode?"))throw Error('[R1201] album/print walk-in generator must run before this patch');
  const loadStart='const provider=storage();let directory,bootstrap,loadError;';
  const loadNew=[
    loadStart,
    "  // R1201: immediate response, even on a cold local-device bootstrap.",
    "  let prepCancelled=false;",
    "  const prep=node('dialog',null,'pb1201IntakeLoading');",
    "  prep.setAttribute('dir','rtl');prep.setAttribute('aria-label',intakeTitle);",
    "  const prepBox=node('div',null,'pb1201IntakeLoadingInner');",
    "  prepBox.append(node('h2',intakeTitle),node('p','در حال بررسی کامپیوتر اصلی و دریافت اطلاعات سفارش…'));",
    "  const prepCancel=node('button','انصراف');prepCancel.type='button';",
    "  prepCancel.onclick=()=>{prepCancelled=true;prep.close();};",
    "  prep.addEventListener('cancel',()=>{prepCancelled=true;});",
    "  prepBox.append(prepCancel);prep.append(prepBox);document.body.append(prep);prep.showModal();"
  ].join('\n');
  intake=once(intake,loadStart,loadNew,'responsive initial walk-in dialog');
  const finallyOld="finally{opening=false;if(launch){launch.disabled=false;launch.textContent=intakeTitle;}}";
  const finallyNew="finally{if(prep.open)prep.close();prep.remove();opening=false;if(launch){launch.disabled=false;launch.textContent=intakeTitle;}}\n  if(prepCancelled)return;";
  intake=once(intake,finallyOld,finallyNew,'close/cancel warm-up before real form');
  fs.writeFileSync(intakeFile,intake);
}

const indexFile='dist/web/index.html';
let html=fs.readFileSync(indexFile,'utf8');
if(!html.includes('/photobridge-r1201-lab-controls.css?v=r1201')) {
  if(!html.includes('</body>'))throw Error('[R1201] HTML body missing');
  html=html.replace('</body>','<link rel="stylesheet" href="/photobridge-r1201-lab-controls.css?v=r1201">\n</body>');
}
const assetRe=/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g;
if([...html.matchAll(assetRe)].length!==1)throw Error('[R1201] primary JS URL changed');
html=html.replace(assetRe,m=>m.includes('&lab=r1201')?m:m+'&lab=r1201');
fs.writeFileSync(indexFile,html);
for(const file of [uiFile,birthdayFile,intakeFile])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1201-lab-controls.cjs'],{stdio:'inherit'});
