// R1961 — persist prices for all active binding-eligible album sizes.
// R1960 sync marks priced custom/combined binding sizes active even when the
// historical lab_album_sizes.binding_price is 0. Cover price edits must use
// exactly that active-size scope, also when resolving labels to DB size ids.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const file='dist/api/server.js';
let server=fs.readFileSync(file,'utf8');
const start=server.indexOf("if (req.method === 'PUT' && url.pathname === '/api/lab/album-settings')");
const end=start<0?-1:server.indexOf("\n        if (req.method",start+70);
if(start<0||end<=start)throw Error('[R1961] album settings PUT boundaries missing');
let route=server.slice(start,end);
function once(before,after,label){
  const n=route.split(before).length-1;
  if(n!==1)throw Error('[R1961] '+label+' expected once, got '+n);
  route=route.replace(before,after);
}
once(
  '(albumBase.sizes || []).filter((x) => x.active !== false && Number(x.bindingPrice || 0) > 0)',
  '(albumBase.sizes || []).filter((x) => x.active !== false)',
  'save validation uses active binding sizes');
once(
  'SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true AND binding_price>0 ORDER BY sort_order,label',
  'SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label',
  'cover/package size id mapping includes custom/combined binding');
if(!route.includes('INSERT INTO lab_album_cover_variant_prices') ||
   !route.includes('sizeIdsByLabel.get(cleanText(pr.sizeLabel))'))
  throw Error('[R1961] cover price write path changed');
server=server.slice(0,start)+route+server.slice(end);
fs.writeFileSync(file,server);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1961] album cover tariffs accept active custom/combined binding sizes; zero-price covers still excluded from customer catalog');
