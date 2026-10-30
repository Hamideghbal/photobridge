import fs from 'node:fs';

const cssPath = 'dist/web/photobridge-r1503-admin-preview-layout.css';
const htmlPath = 'dist/web/index.html';
const css = `/* PB1503: keep platform-admin lab preview notice in normal page flow. */
html body.pbAdminImpersonating #root{
 display:flex!important;flex-direction:column!important;align-items:stretch!important;
 justify-content:flex-start!important;min-height:100dvh!important;height:auto!important
}
html body.pbAdminImpersonating #root>.pbAdminImpersonationNotice{
 position:relative!important;inset:auto!important;z-index:1200!important;display:flex!important;
 align-items:center!important;justify-content:space-between!important;direction:rtl!important;
 width:100%!important;height:auto!important;min-height:42px!important;max-height:64px!important;
 box-sizing:border-box!important;flex:0 0 auto!important;align-self:stretch!important;
 margin:0!important;padding:5px 12px!important;overflow:visible!important;
 background:#fff7ed!important;border-bottom:1px solid #fed7aa!important;
 box-shadow:0 3px 12px rgba(124,45,18,.08)!important;color:#9a3412!important
}
html body.pbAdminImpersonating #root>.pbAdminImpersonationNotice>div{
 display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important;
 flex:1 1 auto!important;flex-wrap:wrap!important
}
html body.pbAdminImpersonating #root>.pbAdminImpersonationNotice button{
 position:static!important;inset:auto!important;flex:0 0 auto!important;white-space:nowrap!important;
 min-height:30px!important;height:30px!important;padding:4px 9px!important;
 border:1px solid #fdba74!important;border-radius:8px!important;background:#fff!important;
 color:#9a3412!important;font:800 11px/1.4 Vazirmatn,Tahoma,sans-serif!important
}
html body.pbAdminImpersonating .labOrderAlarmLayer,
html body.pbAdminImpersonating .persistentPrintAlarm{display:none!important;pointer-events:none!important}
html body.pbAdminImpersonating .labRoleWorkspace{min-height:0!important}
@media(max-width:600px){
 html body.pbAdminImpersonating #root>.pbAdminImpersonationNotice{min-height:42px!important;padding:4px 7px!important;gap:6px!important}
 html body.pbAdminImpersonating #root>.pbAdminImpersonationNotice>div{gap:5px!important}
 html body.pbAdminImpersonating #root>.pbAdminImpersonationNotice button{min-height:28px!important;height:28px!important;padding:3px 7px!important;font-size:10px!important}
}
`;

fs.writeFileSync(cssPath, css);
let html = fs.readFileSync(htmlPath, 'utf8');
const marker = '/photobridge-r1503-admin-preview-layout.css?v=r1503-admin-preview-layout';
if (!html.includes(marker)) {
  if (!html.includes('</head>')) throw new Error('R1503 expected document head');
  html = html.replace('</head>', `<link rel="stylesheet" href="${marker}">\n</head>`);
  fs.writeFileSync(htmlPath, html);
}
