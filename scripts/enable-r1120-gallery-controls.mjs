import fs from 'node:fs';
const path='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(path,'utf8');
js=js.replace('L.status==="published"?"برگردان به پیش‌نویس":"انتشار گالری"','L.status==="published"?"غیرفعال کردن":"فعال کردن گالری"');
js=js.replace('L.status==="published"&&e.jsx("button",{className:"pbActionButton secondaryAction",onClick:()=>window.open(L.share_url','e.jsx("button",{className:"pbActionButton secondaryAction",onClick:()=>window.open(L.share_url');
js=js.replace('e.jsx("button",{onClick:async()=>{await bh(l.share_url),window.pb1113GalleryNotice("لینک خصوصی کپی شد.")},children:"کپی لینک مشتری"})','null');fs.writeFileSync(path,js);
