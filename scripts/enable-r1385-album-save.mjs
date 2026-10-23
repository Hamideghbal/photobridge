import fs from 'node:fs';
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(photobridge-r1380-album-editor\.css\?v=)[^"']+/g,'$1r1385').replace(/&flatAlbum=[^&"']*/g,'&flatAlbum=r1385');fs.writeFileSync(index,html);
