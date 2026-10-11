import fs from 'node:fs';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8');
 const tag='<script src="/photobridge-r1106-mobile-store-panel.js?v=1107"></script>';
 const previous=/<script src="\/photobridge-r1106-mobile-store-panel\.js\?v=\d+"><\/script>/;
 if(previous.test(html))html=html.replace(previous,tag);else html=html.replace('</head>',tag+'\n</head>');
 // Before settings arrive, show the three always-enabled tabs rather than briefly revealing disabled features.
 const style='<style id="pb1106TabsPrepaint">html[data-pb1106-tabs-pending] body .photographerBottomAppNav button:has(.photographerBottomNavIcon.ai),html[data-pb1106-tabs-pending] body .photographerBottomAppNav button:has(.photographerBottomNavIcon.album),html[data-pb1106-tabs-pending] body .photographerBottomAppNav button:has(.photographerBottomNavIcon.instagram){display:none!important}html[data-pb1106-tabs-pending] body .photographerBottomAppNav .photographerBottomAppNavGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important}</style><script>document.documentElement.dataset.pb1106TabsPending="1";</script>';
 if(!html.includes('id="pb1106TabsPrepaint"'))html=html.replace('</head>',style+'\n</head>');
 fs.writeFileSync(file,html);
}
