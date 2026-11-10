// Per-lab local download folder alias for a connected photographer.
// Uses the existing JSONB platform_settings table; no migration, no shared user rename.
const PREFIX='lab_photographer_folder_alias:';
const prohibited=/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
export function normalizeLabPhotographerFolderAlias(value){
 if(typeof value!=='string')return null;
 const name=value.trim().replace(/\s+/g,' ');
 if(!name)return '';
 if(name.length>64||! /^[A-Za-z0-9][A-Za-z0-9 ._-]*[A-Za-z0-9]$/.test(name)&&! /^[A-Za-z0-9]$/.test(name)||
  prohibited.test(name)||name==='.'||name==='..')return null;
 return name;
}
export function labPhotographerFolderAliasKey(labId,userId){
 return PREFIX+String(labId)+':'+String(userId);
}
export async function updateLabPhotographerFolderAlias({pool,labId,userId,alias}){
 const name=normalizeLabPhotographerFolderAlias(alias);
 if(name===null)return {ok:false,error:'invalid_folder_latin_name',status:400};
 // Connection and lab isolation are mandatory even for a preregistered member.
 const q=await pool.query("SELECT 1 FROM lab_memberships WHERE lab_id=$1 AND user_id=$2 AND role='customer' LIMIT 1",[labId,userId]);
 if(!q.rowCount)return {ok:false,error:'customer_not_found',status:404};
 const key=labPhotographerFolderAliasKey(labId,userId);
 if(name){
  await pool.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now())
    ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`,[key,JSON.stringify({folderLatinName:name})]);
 }else await pool.query('DELETE FROM platform_settings WHERE key=$1',[key]);
 return {ok:true,name};
}
