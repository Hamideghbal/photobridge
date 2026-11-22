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
// R1815 already includes combined-model tariffs in this save filter, but not
// separate custom binding models. R1960 sync already determines eligibility
// and keeps the corresponding rows active; align the save path with that scope.
const existingGate=/sizes = \(albumBase\.sizes \|\| \[\]\)\.filter\(\(x\) => [^\n]*?\), extras =/g;
const gates=[...route.matchAll(existingGate)];
if(gates.length!==1 || !gates[0][0].includes('albumCombinedModelRates') ||
   !gates[0][0].includes('bindingPrice'))
  throw Error('[R1961] final album save size gate changed: '+gates.length);
route=route.replace(existingGate,
  'sizes = (albumBase.sizes || []).filter((x) => x.active !== false), extras =');
// R1805 already removed the legacy price gate from SQL, so do not rewrite
// this query a second time. Retain its active-only rule and label allowlist.
if(!route.includes('SELECT id,label FROM lab_album_sizes WHERE lab_id=$1 AND active=true ORDER BY sort_order,label') ||
   !route.includes('if(sizeNames.includes(cleanText(row.label)))sizeIdsByLabel.set(cleanText(row.label), String(row.id));'))
  throw Error('[R1961] existing active-size SQL mapping unavailable');
if(!route.includes('INSERT INTO lab_album_cover_variant_prices') ||
   !route.includes('sizeIdsByLabel.get(cleanText(pr.sizeLabel))'))
  throw Error('[R1961] cover price write path changed');
server=server.slice(0,start)+route+server.slice(end);
fs.writeFileSync(file,server);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1961] album cover tariffs accept active custom/combined binding sizes; zero-price covers still excluded from customer catalog');
