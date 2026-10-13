import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const bundlePath='dist/web/assets/index-UIRefine-v655-r84.js';
let bundle=fs.readFileSync(bundlePath,'utf8');
if(!bundle.includes('pb1179InvoiceAutoPreview')){
 const anchor='await ye(),await Gt(le,"ready"),qt=!0;const Bt=await Wu(Zt.invoice)';
 if(bundle.split(anchor).length!==2)throw new Error('R1179 ready invoice hook not unique');
 bundle=bundle.replace(anchor,
  'await ye(),await Gt(le,"ready"),qt=!0;/* pb1179InvoiceAutoPreview: open the same full invoice detail used by the existing invoice button, after readiness was successfully committed. */Qn(Zt.invoice.id,Zt.invoice).catch(()=>{});const Bt=await Wu(Zt.invoice)');
 fs.writeFileSync(bundlePath,bundle);
}
const indexPath='dist/web/index.html';
let html=fs.readFileSync(indexPath,'utf8');
const css='<link rel="stylesheet" href="/photobridge-r1179-lab-intake-compact.css?v=r1179">';
html=html.replace(css,'').replace('</head>',css+'\n</head>');
for(const ext of ['css','js']){
 const name='photobridge-r1137-lab-local-intake.'+ext;
 html=html.replace(new RegExp('('+name.replaceAll('.','\\.')+'\\?v=)[^"\\s]+','g'),'$1r1179');
}
html=html.replace(/(&intake=)r\d+/,'$1r1179');
fs.writeFileSync(indexPath,html);
execFileSync(process.execPath,['--check',bundlePath],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1179-lab-intake-compact-ready.cjs'],{stdio:'inherit'});
