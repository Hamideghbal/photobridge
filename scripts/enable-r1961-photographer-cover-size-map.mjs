// R1961 — the photographer cover list must use the same active album sizes as the Lab cover editor.
// R1960 enabled model-specific and combined binding tariffs; this legacy SELECT still discarded them.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let src=fs.readFileSync(path,'utf8');
const start=src.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/album-settings')");
if(start<0)throw Error('[R1961] lab album-settings PUT missing');
const end=src.indexOf("\n        if (req.method",start+30);
const section=src.slice(start,end<0?undefined:end);
const old='SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true AND binding_price>0 ORDER BY sort_order,label';
const replacement='SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label';
if(section.split(old).length!==2)throw Error('[R1961] expected exactly one obsolete cover size filter');
src=src.replace(old,replacement);
if(!src.includes(replacement))throw Error('[R1961] corrected cover size SQL missing');
fs.writeFileSync(path,src);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1961] cover settings save maps all active priced binding sizes, including custom and combined models');
