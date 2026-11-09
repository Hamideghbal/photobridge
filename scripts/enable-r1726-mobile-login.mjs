// R1726: mobile login top alignment and browser install invitation.
// Install only site-facing assets. Do not mutate Windows desktop UI packages.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const css='/photobridge-r1726-mobile-login.css?v=r1726';
const js='/photobridge-r1726-login-install.js?v=r1726';
for(const htmlFile of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
  if(!fs.existsSync(htmlFile))continue;
  let html=fs.readFileSync(htmlFile,'utf8');
  // The portal can be a zero-byte placeholder prior to deployment generation.
  if(!html.trim())continue;
  if(!html.includes('</head>')||!html.includes('</body>'))throw Error('[R1726] incomplete HTML: '+htmlFile);
  if(!html.includes(css))html=html.replace('</head>','<link rel="stylesheet" href="'+css+'">\n</head>');
  if(!html.includes(js))html=html.replace('</body>','<script defer src="'+js+'"></script>\n</body>');
  if(html.split(css).length!==2||html.split(js).length!==2)
    throw Error('[R1726] login assets not uniquely installed: '+htmlFile);
  fs.writeFileSync(htmlFile,html);
}
execFileSync(process.execPath,['--check','dist/web/photobridge-r1726-login-install.js'],{stdio:'inherit'});
console.log('[R1726] compact top-anchored mobile login + install banner active for browser login only');
