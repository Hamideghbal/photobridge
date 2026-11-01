'use strict';
const fs=require('node:fs'),path=require('node:path');
// Storage-bridge compatibility alone is insufficient: older, validly hashed UI
// bundles can still omit current settings and customer navigation.
function validateNavigation(root){
 const read=name=>{try{return fs.readFileSync(path.join(root,name),'utf8');}catch{throw Error('ui_navigation_asset_missing:'+name);}};
 const main=read('assets/index-UIRefine-v655-r84.js'),html=read('index.html');
 const group=main.match(/key:["']general["'],label:[\s\S]*?items:\[([\s\S]*?)\]\s*\}\s*,\s*\{key:["']customers["']/)?.[1]||'';
 for(const section of ['general','hours','sms','snappbox','site','desktop'])if(!new RegExp('\\["'+section+'",').test(group))throw Error('ui_navigation_incomplete:general:'+section);
 for(const asset of ['photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js'])if(!html.includes(asset))throw Error('ui_navigation_script_missing:'+asset);
 const header=read('photobridge-r1147-lab-admin-header.js'),customers=read('photobridge-r1372-third-header.js');
 if(!main.includes('labArchiveHeaderBtn')||!header.includes('labArchiveHeaderBtn'))throw Error('ui_navigation_incomplete:archive');
 for(const section of ['photographers','invites','collaboration'])if(!customers.includes('/lab/settings/customers/'+section))throw Error('ui_navigation_incomplete:customers:'+section);
 if(!customers.includes('/lab/settings/walkin'))throw Error('ui_navigation_incomplete:customers:walkin');
 return true;
}
module.exports={validateNavigation};
