import fs from 'node:fs';
import path from 'node:path';

// R1999: preserve individual selected/unselected buttons and separators, but
// remove the enclosing outline around Print/Album/Finance/Video navigation.
const cssFile='dist/web/photobridge-r1989-model2-segmented.css';
let css=fs.readFileSync(cssFile,'utf8');
if(!css.includes('/* PB1999 borderless navigation shells */')){
 if(!css.includes('pb1989ModelTwo')||!css.includes('pb1127PrintUtilities'))throw Error('[R1999] model two toolbar CSS not found');
 css += [
  '',
  '/* PB1999 borderless navigation shells */',
  'html body #pb1126ChromeHost #pb1126DesktopHeader .pb1126Secondary .pb1127PrintModes.pb1989ModelTwo,',
  'html body .photographerPrintWorkspace .photographerPrintModeNav.pb1989ModelTwo{',
  ' border:0!important;border-inline-start:0!important;border-inline-end:0!important;',
  ' outline:0!important;box-shadow:none!important;background:transparent!important;',
  '}',
  'html body #pb1126ChromeHost #pb1126DesktopHeader .pb1126Secondary .pb1127PrintUtilities,',
  'html body .photographerPrintWorkspace .photographerPrintModeUtilityCluster{',
  ' border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;',
  '}',
  ''
 ].join('\n');
 fs.writeFileSync(cssFile,css);
}

// Photographer-to-photographer invitation: explicitly bind to the photographer
// portal cookie even if the user also manages a laboratory. The same component
// serves three portals; do NOT change the separate lab invitation send call.
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';
let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1999 photographer invite portal */')){
 const original='Me("/api/photographer-invites/send-sms",{method:"POST",body:JSON.stringify({mobile:A})})';
 const fixed='Me("/api/photographer-invites/send-sms",{method:"POST",headers:{"x-photobridge-portal":"photographer"},body:JSON.stringify({mobile:A})})';
 if(ui.split(original).length!==2)throw Error('[R1999] photographer SMS request anchor missing or ambiguous');
 ui=ui.replace(original,fixed)+'\n/* PB1999 photographer invite portal */\n';
 fs.writeFileSync(uiFile,ui);
}

// The photographer SMS flow used to SELECT every mobile in the user table and
// compare them in Node, then failed to auto-repair partially migrated invite
// schemas. Do not alter laboratory invitation validation/policies.
const serverFile='dist/api/server.js';
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('/* PB1999 photographer recipient lookup */')){
 const position='async function mobileAlreadyRegistered(mobile) {';
 if(server.split(position).length!==2)throw Error('[R1999] existing registered-mobile helper not found');
 const helper=[
  '/* PB1999 photographer recipient lookup */',
  'async function photographerInviteRecipientRegistered(mobile) {',
  "    const variants = [mobile, '98'+mobile.slice(1), '+98'+mobile.slice(1), '0098'+mobile.slice(1), mobile.slice(1)];",
  "    const exact=await pool.query('SELECT 1 FROM users WHERE mobile=ANY($1::text[]) LIMIT 1',[variants]);",
  '    if(exact.rowCount)return true;',
  "    const historical=await pool.query(\"SELECT 1 FROM users WHERE right(regexp_replace(COALESCE(mobile,''),'[^0-9]','','g'),10)=$1 LIMIT 1\",[mobile.slice(-10)]);",
  '    return Boolean(historical.rowCount);',
  '}',
  ''
 ].join('\n');
 server=server.replace(position,helper+position);
 const start=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/photographer-invites/send-sms') {");
 const end=server.indexOf('    const photographerInvitePatch =',start);
 if(start<0||end<start)throw Error('[R1999] photographer invite SMS endpoint not found');
 let route=server.slice(start,end);
 const once=(oldValue,newValue,label)=>{
  if(route.split(oldValue).length!==2)throw Error('[R1999] '+label+' not unique in invite route');
  route=route.replace(oldValue,newValue);
 };
 once(
  'if (await mobileAlreadyRegistered(mobile))',
  'if (await photographerInviteRecipientRegistered(mobile))',
  'avoid full users mobile table transfer'
 );
 once(
  '            let inv = existing.rows[0] || null, reused = Boolean(existing.rowCount);',
  '            let inv = existing.rows[0] || null, reused = Boolean(existing.rowCount), repairedSchema = false;',
  'one-time schema repair flag'
 );
 // Make migrated legacy databases retry once, as the existing manual-create
 // invite route does. No retry for foreign-key, invalid arguments, or providers.
 const oldCatch=[
  '                    catch (e) {',
  "                        if (String(e?.code || '') === '23505')",
  '                            continue;',
  '                        throw e;',
  '                    }'
 ].join('\n');
 const newCatch=[
  '                    catch (e) {',
  "                        const dbCode=String(e?.code||'');",
  "                        if(dbCode==='23505')continue;",
  "                        if(!repairedSchema&&['23502','23514','42703','42P01'].includes(dbCode)){",
  '                            repairedSchema=true;',
  '                            await repairPhotographerInviteRuntimeSchema();',
  '                            continue;',
  '                        }',
  '                        throw e;',
  '                    }'
 ].join('\n');
 const photographerBranchEnd=route.indexOf("        if (scope.type !== 'lab' || !scope.labId)");
 if(photographerBranchEnd<0)throw Error('[R1999] photographer branch boundary missing');
 const photographerPart=route.slice(0,photographerBranchEnd);
 if(photographerPart.split(oldCatch).length!==2)throw Error('[R1999] photographer SMS schema retry anchor missing');
 route=photographerPart.replace(oldCatch,newCatch)+route.slice(photographerBranchEnd);
 // A provider-accepted SMS must not be shown as failed if the secondary
 // invite presentation query later throws (which would trigger duplicate sends).
 once(
  '                const full = await photographerInviteByCode(inv.code);',
  '                const full = await photographerInviteByCode(inv.code).catch(() => inv) || inv;',
  'keep SMS send result independent from optional invite presentation query'
 );
 server=server.slice(0,start)+route+server.slice(end);
 fs.writeFileSync(serverFile,server);
}

// Refresh cached CSS and JS on all served variants after the last asset writer.
function pages(dir){
 if(!fs.existsSync(dir))return;
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,item.name);
  if(item.isDirectory()){pages(file);continue;}
  if(!item.name.endsWith('.html'))continue;
  const html=fs.readFileSync(file,'utf8');
  let next=html.replace(/(photobridge-r1989-model2-segmented\.css)([^"'<> \t\r\n]*)/g,(_,name,q)=>{
   const clean=q.replace(/([?&])bareFrame=[^&]*/g,'$1').replace(/[?&]$/,'');
   return name+clean+(clean.includes('?')?'&':'?')+'bareFrame=r1999';
  });
  next=next.replace(/(index-UIRefine-v655-r84\.js)([^"'<> \t\r\n]*)/g,(_,name,q)=>{
   const clean=q.replace(/([?&])inviteSend=[^&]*/g,'$1').replace(/[?&]$/,'');
   return name+clean+(clean.includes('?')?'&':'?')+'inviteSend=r1999';
  });
  if(next!==html)fs.writeFileSync(file,next);
 }
}
pages('dist/web');pages('dist/api');
console.log('[R1999] frameless Print modes, explicit photographer invite scope, indexed-first recipient lookup and schema retry.');
