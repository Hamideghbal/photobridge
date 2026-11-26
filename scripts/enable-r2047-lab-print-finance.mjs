// Final server and Lab web/native changes, before R1897 refreshes the compressed assets.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const {pb2047Ui,pb2047Server}=new Function(read('scripts/r2047-lab-print-finance-patch.js.txt')+'\nreturn {pb2047Ui,pb2047Server}')();
const server='dist/api/server.js';
write(server,pb2047Server(read(server)));
execFileSync(process.execPath,['--check',server],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const asset=root+'/assets/index-UIRefine-v655-r84.js',html=root+'/index.html';
 write(asset,pb2047Ui(read(asset)));
 execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
 let h=read(html);
 const re=/index-UIRefine-v655-r84\.js\?[^"'<> \t\r\n]*/g;
 if([...h.matchAll(re)].length!==1)throw Error('[R2047] missing UI asset '+root);
 h=h.replace(re,u=>u.includes('labPrintFinance=r2047')?u:u+'&labPrintFinance=r2047');
 if(!h.includes('id="pb2047LabFinanceStyle"'))h=h.replace('</head>', '<style id="pb2047LabFinanceStyle">html body #root#root .labRoleWorkspace .financeWorkspace .statementFilters{flex-wrap:wrap!important}html body #root#root .labRoleWorkspace .financeWorkspace .statementFilters>button.pb2047StatementRange{display:inline-flex!important;visibility:visible!important;opacity:1;align-items:center;justify-content:center;flex:0 0 auto!important;min-width:100px!important;width:auto!important;white-space:nowrap!important;min-height:34px!important;padding:5px 12px!important;position:static!important}html body #root#root .labRoleWorkspace .financeWorkspace .statementFilters>button.pb2047StatementRange:disabled{opacity:.6}</style></head>');
 write(html,h);
}
console.log('[R2047] Lab filename cleanup, manual print stage and finance range controls prepared in both payloads');
