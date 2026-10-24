import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1378 finance guide */')){
 const a=ui.indexOf('t==="lab"&&s&&e.jsxs("button",{className:"financeQuickPin '),b=ui.indexOf('e.jsxs("button",{className:"financeHelpButton"',a);if(a<0||b<a)throw Error('R1378 finance tools changed');ui=ui.slice(0,a)+ui.slice(b);
 const intro='e.jsx(lj,{section:w,role:t})';if(ui.split(intro).length!==2)throw Error('R1378 finance guide changed');
 ui=ui.replace(intro,'t==="lab"&&e.jsx("p",{children:"بخش‌های مالی را از ردیف سوم سربرگ انتخاب کنید. فاکتور سفارش چاپ و آلبوم هنگام «آماده تحویل» صادر می‌شود؛ پیش‌فاکتورِ سفارش، فاکتور نهایی نیست. دریافت وجه را در «دریافت‌ها» ثبت کنید و نتیجه را در «حساب معین» ببینید. تعرفه‌ها از بخش «تعرفه‌ها» مدیریت می‌شوند."}),'+intro);
 ui+='\n/* PB1378 finance guide */\n';fs.writeFileSync(file,ui);
}
const invite='dist/web/photobridge-v904r98-invite-stable.js';let s=fs.readFileSync(invite,'utf8');
if(!s.includes('/* PB1378 public invite mobile entry */')){
 const anchor='      if(!accepted&&!state.contextReady&&validInvite&&!initialMobile&&!normalizeMobile(state.ctx?.invite?.targetMobile))releaseContextGate();';
 if(s.split(anchor).length!==2)throw Error('R1378 invite bootstrap changed: R1411 fast/context gate');
 s=s.replace(anchor,`      if(!accepted&&!state.contextReady&&validInvite&&!initialMobile&&!normalizeMobile(state.ctx?.invite?.targetMobile)){
        if(state.ctx?.invite?.active){
          /* PB1378 public invite mobile entry */
          state.awaitingMobile=true;
          accepted=true;
          clearTimeout(window.__PB_INVITE_GATE_TIMEOUT__);
          document.getElementById('pbInviteContextRetry')?.remove();
          document.documentElement.classList.remove('pbR100F7InviteBootPending');
          scheduleSeries();
        }else{
          releaseContextGate();
        }
      }`);
 s=s.replace('    mergeCtx(x);\n    releaseContextGate();','    state.awaitingMobile=false;document.querySelector(".photographerSignupForm")?.classList.remove("pb1378AwaitMobile");\n    mergeCtx(x);\n    releaseContextGate();');
 const render="if(!form||!state.ctx||!state.contextReady)return;";if(s.split(render).length!==2)throw Error('R1378 invite render changed');s=s.replace(render,'if(!form||!state.ctx)return;if(state.awaitingMobile){form.classList.add("pb1378AwaitMobile");return}form.classList.remove("pb1378AwaitMobile");if(!state.contextReady)return;');
 const end='  enableInviteScroll();bootstrap();scheduleSeries();\n})();';if(s.split(end).length!==2)throw Error('R1378 invite end changed');s=s.replace(end,`  const mobileStyle=document.createElement('style');mobileStyle.textContent='.pb1378AwaitMobile label:not(:has(input[inputmode="tel"])),.pb1378AwaitMobile .iranLocationFields,.pb1378AwaitMobile .photographerSignupLocationPicker,.pb1378AwaitMobile button:not([type="button"]){display:none!important}';document.head.append(mobileStyle);
  document.addEventListener('submit',event=>{if(state.awaitingMobile&&event.target.matches?.('.photographerSignupForm')){event.preventDefault();event.stopImmediatePropagation()}},true);
`+end);fs.writeFileSync(invite,s);
}
const p='dist/web/index.html';let html=fs.readFileSync(p,'utf8');html=html.replace(/(photobridge-v904r98-invite-stable\.js\?v=)([^"'&\s]+)/,(_full,prefix,version)=>{const n=/^r(\d+)$/.exec(version);return prefix+(n&&Number(n[1])>=1378?version:'r1378')});html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&labFixes=')?u:u+'&labFixes=r1378');fs.writeFileSync(p,html);
