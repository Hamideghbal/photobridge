// R1976: independent customer and calendar visibility for Photographer and Lab.
// Preserve the legacy shared 'customers' flag when reading older saved settings.
export const PHOTOGRAPHER_TABS_KEY='photographer_navigation_tabs';
export const PHOTOGRAPHER_TAB_KEYS=['ai','album','instagram','customers','calendar','lab_customers','lab_calendar'];
export function normalizePhotographerTabs(value){
 const old=value&&typeof value==='object'?value:{};
 const customer=old.customers!==false;
 const labCustomer=typeof old.lab_customers==='boolean'?old.lab_customers:customer;
 return {
  ai:old.ai!==false,album:old.album!==false,instagram:old.instagram!==false,
  customers:customer,
  calendar:typeof old.calendar==='boolean'?old.calendar:customer,
  lab_customers:labCustomer,
  lab_calendar:typeof old.lab_calendar==='boolean'?old.lab_calendar:labCustomer
 };
}
export function photographerTabsForUser(settings,user,portal='photographer'){
 const effective=normalizePhotographerTabs(settings);
 const adminBypass=user?.platformRole==='platform_admin';
 const lab=portal==='lab';
 const roleTabs={...effective,customers:lab?effective.lab_customers:effective.customers,calendar:lab?effective.lab_calendar:effective.calendar};
 // The administrator's preview bypass is only for legacy AI/album/Instagram;
 // CRM and calendar visibility must be respected for both portals, even admin previews.
 return {tabs:adminBypass?{...roleTabs,ai:true,album:true,instagram:true}:roleTabs,adminBypass};
}
export async function handlePhotographerTabSettings({req,res,url,a,pool,requireRole,bodyJson,sendJson,audit}){
 const admin=url.pathname==='/api/admin/photographer-tabs';
 const publicRead=url.pathname==='/api/photographer/navigation-tabs'&&req.method==='GET';
 if(!admin&&!publicRead)return false;
 if(admin&&!requireRole(a,'platform_admin')){sendJson(res,403,{error:'forbidden'});return true}
 if(req.method==='GET'){
  const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[PHOTOGRAPHER_TABS_KEY]);
  const settings=normalizePhotographerTabs(q.rows[0]?.value);
  const portal=String(req.headers?.['x-photobridge-portal']||'photographer').toLowerCase()==='lab'?'lab':'photographer';
  res.setHeader('cache-control','no-store');
  sendJson(res,200,admin?{tabs:settings}:photographerTabsForUser(settings,a,portal));return true;
 }
 if(admin&&req.method==='PUT'){
  const b=await bodyJson(req);
  if(!b?.tabs||['ai','album','instagram'].some(key=>typeof b.tabs[key]!=='boolean')||
    Object.entries(b.tabs).some(([key,val])=>!PHOTOGRAPHER_TAB_KEYS.includes(key)||typeof val!=='boolean')){
   sendJson(res,400,{error:'invalid_photographer_tabs'});return true;
  }
  // Old admin windows send only the three original fields. Never erase newer
  // role-specific choices when a stale admin tab submits.
  const previous=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[PHOTOGRAPHER_TABS_KEY]);
  const tabs=normalizePhotographerTabs({...normalizePhotographerTabs(previous.rows[0]?.value),...b.tabs});
  await pool.query('INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[PHOTOGRAPHER_TABS_KEY,JSON.stringify(tabs)]);
  await audit(a.userId,undefined,'platform_admin.photographer_tabs_update','platform_setting',PHOTOGRAPHER_TABS_KEY,tabs).catch(()=>{});
  res.setHeader('cache-control','no-store');sendJson(res,200,{ok:true,tabs});return true;
 }
 sendJson(res,405,{error:'method_not_allowed'});return true;
}
