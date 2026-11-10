// Photographer navigation settings use the existing platform_settings table.
export const PHOTOGRAPHER_TABS_KEY='photographer_navigation_tabs';
export const PHOTOGRAPHER_TAB_KEYS=['ai','album','instagram','customers'];
export function normalizePhotographerTabs(value){
 return Object.fromEntries(PHOTOGRAPHER_TAB_KEYS.map(key=>[key,value?.[key]!==false]));
}
export function photographerTabsForUser(settings,user){
 const adminBypass=user?.platformRole==='platform_admin';
 const effective=normalizePhotographerTabs(settings);
 // Other photographer tabs keep their existing admin preview bypass, but the
 // shared Customers switch must be respected for both portals, even admins.
 return {tabs:adminBypass?{...normalizePhotographerTabs(null),customers:effective.customers}:effective,adminBypass};
}
export async function handlePhotographerTabSettings({req,res,url,a,pool,requireRole,bodyJson,sendJson,audit}){
 const admin=url.pathname==='/api/admin/photographer-tabs';
 const publicRead=url.pathname==='/api/photographer/navigation-tabs'&&req.method==='GET';
 if(!admin&&!publicRead)return false;
 if(admin&&!requireRole(a,'platform_admin')){sendJson(res,403,{error:'forbidden'});return true}
 if(req.method==='GET'){
  const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[PHOTOGRAPHER_TABS_KEY]);
  const settings=normalizePhotographerTabs(q.rows[0]?.value);
  res.setHeader('cache-control','no-store');
  sendJson(res,200,admin?{tabs:settings}:photographerTabsForUser(settings,a));return true;
 }
 if(admin&&req.method==='PUT'){
  const b=await bodyJson(req);
  if(!b?.tabs||PHOTOGRAPHER_TAB_KEYS.some(key=>typeof b.tabs[key]!=='boolean')||Object.keys(b.tabs).some(key=>!PHOTOGRAPHER_TAB_KEYS.includes(key))){sendJson(res,400,{error:'invalid_photographer_tabs'});return true}
  const tabs=normalizePhotographerTabs(b.tabs);
  await pool.query('INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[PHOTOGRAPHER_TABS_KEY,JSON.stringify(tabs)]);
  await audit(a.userId,undefined,'platform_admin.photographer_tabs_update','platform_setting',PHOTOGRAPHER_TABS_KEY,tabs).catch(()=>{});
  res.setHeader('cache-control','no-store');sendJson(res,200,{ok:true,tabs});return true;
 }
 sendJson(res,405,{error:'method_not_allowed'});return true;
}
