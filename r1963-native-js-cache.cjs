'use strict';
const fs=require('node:fs');let last=null;
function compile({file,version,render}){
 const stat=fs.statSync(file);if(!stat.isFile())throw Error('native_ui_asset_missing');
 const key=[file,version,stat.size,stat.mtimeMs,stat.ino].join('|');
 if(last?.key===key)return last.body;
 const body=render(fs.readFileSync(file,'utf8'));
 if(typeof body!=='string')throw Error('native_bundle_render_failed');
 last={key,body};return body;
}
module.exports={compile,reset(){last=null}};
