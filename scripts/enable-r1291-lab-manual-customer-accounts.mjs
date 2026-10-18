import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes('handleLabManualCustomerAccounts({req,url,res,')){
 const anchor="if (req.method === 'GET' && url.pathname === '/api/lab/delegated-orders/bootstrap') {";
 const n=src.split(anchor).length-1;
 if(n!==1)throw Error('R1291 lab authenticated bootstrap anchor missing: '+n);
 src="import {handleLabManualCustomerAccounts} from './lab-manual-customer-controls.js';\n"+src;
 src=src.replace(anchor,`// PB1291 lab manager ledger and manually requested invoice SMS
        if(await handleLabManualCustomerAccounts({req,url,res,pool,labId,a,bodyJson,sendJson,crypto,sendSms,
          ensureFinanceAccounts,postBalancedFinanceTransaction,requireLocalIntakePrimary,audit}))return;
        `+anchor);
 fs.writeFileSync(file,src);
}
const htmlPath='dist/web/index.html';let html=fs.readFileSync(htmlPath,'utf8');
html=html.replace(/(photobridge-r1137-lab-local-intake\\.js\\?v=)[^"']+/g,'$1r1291');
if(!html.includes('/photobridge-r1291-lab-account-picker.css'))
 html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1291-lab-account-picker.css?v=r1291">\\n</head>');
fs.writeFileSync(htmlPath,html);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/web/photobridge-r1137-lab-local-intake.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1291-lab-manual-customer-accounts.cjs'],{stdio:'inherit'});
