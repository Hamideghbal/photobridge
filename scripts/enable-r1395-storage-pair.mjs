import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1395 changed anchor: '+a.slice(0,100));return s.replace(a,b)};
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('/* PB1395 folder pairing */')){
 server="import {storageDeviceAllowed,pairedTarget} from './lab-storage-pair.js';\n/* PB1395 folder pairing */\n"+server;
 server=once(server,'SELECT primary_download_device_id FROM labs WHERE id=$1 FOR SHARE','SELECT ui_preferences,primary_download_device_id FROM labs WHERE id=$1 FOR SHARE');
 server=once(server,'if (!requestDeviceId || requestDeviceId !== primary)', 'if (!storageDeviceAllowed(q.rows[0],requestDeviceId))');
 server=server.replaceAll('SELECT primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1','SELECT ui_preferences,primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1');
 const guard='if (!requestDeviceId || requestDeviceId !== device.primary_download_device_id)';if(server.split(guard).length!==3)throw Error('R1395 expected two download guards');server=server.replaceAll(guard,'if (!storageDeviceAllowed(device,requestDeviceId))');
 server=once(server,'SELECT primary_download_device_id,primary_download_device_label,primary_download_device_registered_at FROM labs WHERE id=$1`','SELECT ui_preferences,primary_download_device_id,primary_download_device_label,primary_download_device_registered_at FROM labs WHERE id=$1`');
 server=once(server,'const registered = Boolean(row.primary_download_device_id);',"const paired=pairedTarget(row,requestDeviceId);if(paired)return sendJson(res,200,paired);const registered = Boolean(row.primary_download_device_id);");
 // Once paired, legacy registration must never silently evict the other environment.
 server=once(server,'const current = q.rows[0] || {};',"const current = q.rows[0] || {};if(current.ui_preferences?.storageFolderPair){await c.query('ROLLBACK');return sendJson(res,409,{error:'paired_folder_required',message:'مسیر تغییر کرده؛ پوشه را از بخش مسیر ذخیره‌سازی انتخاب و یکسان کنید.'})}");
 fs.writeFileSync('dist/api/server.js',server);
}
let ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
if(!ui.includes('/* PB1395 folder pairing */')){
 ui=once(ui,'function Xj(){return e.jsx(PB1386StoragePanel,{})}','function Xj(){return e.jsx(PB1395StoragePanel,{})}');
 ui=once(ui,'if(root)return root','if(root)return await pb1395GuardRoot(root)');
 ui+='\n/* PB1395 folder pairing */\n'+fs.readFileSync('scripts/r1395-storage-panel.js','utf8')+`\nasync function pb1395GuardRoot(root){Uc();const target=await Me('/api/lab/storage-target');if(!target.paired)return root;if(!target.isThisDevice)return null;if(await root.queryPermission({mode:'readwrite'})!=='granted')return root;return await pb1395FolderId(root)===target.folderId?root:null}\n`;
 fs.writeFileSync('dist/web/assets/index-UIRefine-v655-r84.js',ui);
}
const index='dist/web/index.html';if(fs.existsSync(index)){let html=fs.readFileSync(index,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&folderPair=[^&"']*/g,'')+'&folderPair=r1395');fs.writeFileSync(index,html)}
