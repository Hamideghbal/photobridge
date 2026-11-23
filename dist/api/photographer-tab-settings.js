// R1976: independent CRM/Calendar switches for Photographer and Lab, in the existing platform_settings row.
export const PHOTOGRAPHER_TABS_KEY='photographer_navigation_tabs';
export const PHOTOGRAPHER_TAB_KEYS=['ai','album','instagram','customers','calendar','labCustomers','labCalendar'];
function pb1775DisabledCustomerSetting(x){return x===false||x===0||x==='false'||x==='0'}
export function normalizePhotographerTabs(value){
 const oldShared=!pb1775DisabledCustomerSetting(value?.customers);
 return {
  ai:!pb1775DisabledCustomerSetting(value?.ai),
  album:!pb1775DisabledCustomerSetting(value?.album),
  instagram:!pb1775DisabledCustomerSetting(value?.instagram),
  customers:!pb1775DisabledCustomerSetting(value?.customers),
  // An older shared disable applies to both CRM panes and to both portals.
  calendar:typeof value?.calendar==='boolean'?value.calendar:oldShared,
  labCustomers:typeof value?.labCustomers==='boolean'?value.labCustomers:oldShared,
  labCalendar:typeof value?.labCalendar==='boolean'?value.labCalendar:oldShared
 };
}
export function photographerTabsForUser(settings,user,portal='photographer'){
 const effective=normalizePhotographerTabs(settings),adminBypass=user?.platformRole==='platform_admin';
 // Admins still obey CRM visibility switches. Never bypass a disabled Customers/Calendar pane.
 if(portal==='lab')return {tabs:{customers:effective.labCustomers,calendar:effective.labCalendar},adminBypass:false};
 return {tabs:adminBypass?{...effective,ai:true,album:true,instagram:true}:effective,adminBypass};
}
export async function handlePhotographerTabSettings({req,res,url,a,pool,requireRole,bodyJson,sendJson,audit}){
 const admin=url.pathname==='/api/admin/photographer-tabs';
 const publicRead=url.pathname==='/api/photographer/navigation-tabs'&&req.method==='GET';
 if(!admin&&!publicRead)return false;
 if(admin&&!requireRole(a,'platform_admin')){sendJson(res,403,{error:'forbidden'});return true}
 if(req.method==='GET'){
  const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[PHOTOGRAPHER_TABS_KEY]);
  const settings=normalizePhotographerTabs(q.rows[0]?.value);
  const portal=String(req.headers?.['x-photobridge-portal']||'');
  res.setHeader('cache-control','no-store');
  if(admin){sendJson(res,200,{tabs:settings});return true;}
  const result=photographerTabsForUser(settings,a,portal==='lab'?'lab':'photographer');
  if(portal==='photographer'&&a?.userId){
   // Read-only membership check. Only an active invited/connected photographer
   // may get the Print-first landing; never infer membership from a client flag.
   const connected=await pool.query("SELECT 1 FROM lab_memberships WHERE user_id=$1 AND role='customer' LIMIT 1",[a.userId]);
   result.connectedLab=connected.rowCount>0;
  }else result.connectedLab=false;
  sendJson(res,200,result);return true;
 }
 if(admin&&req.method==='PUT'){
  const b=await bodyJson(req);
  if(!b?.tabs||typeof b.tabs!=='object'||Array.isArray(b.tabs)||!Object.keys(b.tabs).length||
   Object.keys(b.tabs).some(key=>!PHOTOGRAPHER_TAB_KEYS.includes(key)||typeof b.tabs[key]!=='boolean')){
   sendJson(res,400,{error:'invalid_photographer_tabs'});return true;
  }
  // Keep switches omitted by older admin pages and never reactivate a disabled pane.
  const previous=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[PHOTOGRAPHER_TABS_KEY]);
  const current=normalizePhotographerTabs(previous.rows[0]?.value);
  const tabs=normalizePhotographerTabs({...current,...b.tabs});
  await pool.query('INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[PHOTOGRAPHER_TABS_KEY,JSON.stringify(tabs)]);
  await audit(a.userId,undefined,'platform_admin.photographer_tabs_update','platform_setting',PHOTOGRAPHER_TABS_KEY,tabs).catch(()=>{});
  res.setHeader('cache-control','no-store');sendJson(res,200,{ok:true,tabs});return true;
 }
 sendJson(res,405,{error:'method_not_allowed'});return true;
}
