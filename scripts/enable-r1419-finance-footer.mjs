import fs from 'node:fs';
const once=(s,a,b)=>{const n=s.split(a).length-1;if(n!==1)throw Error('R1419 anchor '+n+': '+a.slice(0,90));return s.replace(a,b)};
const file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
if(!ui.includes('/* PB1419 finance footer and all-tab help */')){
 ui=once(ui,'(t!=="lab"||w!=="overview")&&e.jsxs("button",{className:"financeHelpButton"','t!=="lab"&&(t!=="lab"||w!=="overview")&&e.jsxs("button",{className:"financeHelpButton"');
 const finance='f==="finance"&&e.jsx(ub,{role:"lab",quickPinned:be.pinned,onToggleQuick:Ge})';
 const footer='e.jsxs("footer",{className:"productFooter",children:["Powered by ",e.jsx("b",{children:"PhotoBridge"})]})';
 ui=once(ui,finance,'f==="finance"&&e.jsxs("div",{className:"pb1419FinancePage",children:[e.jsx(ub,{role:"lab",quickPinned:be.pinned,onToggleQuick:Ge}),'+footer.replace('className:"productFooter"','className:"productFooter pb1419FinanceFooter"')+']})');
 ui=once(ui,'f!=="settings"&&'+footer,'f!=="settings"&&f!=="finance"&&'+footer);
 fs.writeFileSync(file,ui+'\n/* PB1419 finance footer and all-tab help */\n');
}
const manual='dist/web/photobridge-r1176-lab-finance.js';let m=fs.readFileSync(manual,'utf8');
if(!m.includes('paid.oninput=()=>PB1418FormatMoneyInput(paid)')){
 m=once(m,"paid.inputMode='numeric';paid.value='۰';","paid.inputMode='numeric';paid.value='۰';paid.oninput=()=>PB1418FormatMoneyInput(paid);");
 fs.writeFileSync(manual,m);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes('/photobridge-r1419-finance-footer.css'))html=once(html,'</head>','<link rel="stylesheet" href="/photobridge-r1419-finance-footer.css?v=r1419"></head>');
for(const name of ['photobridge-r1176-lab-finance.js','assets/index-UIRefine-v655-r84.js']){
 const escaped=name.replaceAll('.','\\.');
 html=html.replace(new RegExp('('+escaped+'\\?[^"\x27]*)','g'),link=>link.includes('&financeFooter=')?link:link+'&financeFooter=r1419');
}
fs.writeFileSync('dist/web/index.html',html);
