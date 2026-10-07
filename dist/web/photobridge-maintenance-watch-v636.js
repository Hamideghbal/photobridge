(()=>{
  'use strict';
  const path=location.pathname;
  const protectedPath=path==='/login'||path==='/trial'||path==='/equipment-rental/register'||/^\/lab(?:\/|$)/.test(path)||/^\/photographer(?:\/|$)/.test(path)||/^\/rental(?:\/|$)/.test(path);
  if(!protectedPath)return;
  let busy=false,stopped=false;
  function portal(){if(path.startsWith('/lab'))return'lab';if(path.startsWith('/photographer')||path==='/login')return'photographer';if(path.startsWith('/rental'))return'rental';return''}
  function headers(){const h={};const p=portal();if(p)h['x-photobridge-portal']=p;try{const token=sessionStorage.getItem('lablink_test_session')||'';const info=JSON.parse(sessionStorage.getItem('photobridge_admin_impersonation')||'null');if(token){h.authorization='Bearer '+token;if(info){h['x-photobridge-impersonation']='1';if(p==='lab'&&info.labId)h['x-photobridge-impersonation-lab-id']=String(info.labId)}}}catch{}if(new URLSearchParams(location.search).get('maintenance_preview')==='1'||path==='/trial'||path==='/photographer/signup'||path==='/equipment-rental/register')h['x-photobridge-maintenance-preview']='1';return h}
  async function check(){if(stopped||busy||document.hidden)return;busy=true;try{const r=await fetch('/api/maintenance/status',{credentials:'include',cache:'no-store',headers:headers()}),d=await r.json().catch(()=>({}));if(r.ok&&d.enabled===true&&d.blocked===true){stopped=true;try{window.dispatchEvent(new CustomEvent('photobridge:maintenance-pending',{detail:d}))}catch{}return}}catch{}finally{busy=false}}
  setTimeout(check,450);setInterval(check,2000);addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
})();
