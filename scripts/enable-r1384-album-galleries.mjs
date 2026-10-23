import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1384 changed anchor '+a.slice(0,100));return s.replace(a,b)};
const path='dist/api/server.js';let server=fs.readFileSync(path,'utf8');if(!server.includes('/* PB1384 album galleries */')){
server="import {sanitizeAlbumImageGalleries} from './album-image-galleries.js';\n/* PB1384 album galleries */\n"+server;
server=once(server,'if(b.colorImages!==undefined)b.colorImages=sanitizeAlbumColorImages(b.colorImages)','if(b.colorImages!==undefined)b.colorImages=sanitizeAlbumColorImages(b.colorImages);if(b.imageGalleries!==undefined)b.imageGalleries=sanitizeAlbumImageGalleries(b.imageGalleries)');
server=once(server,"if(b.imageGalleries!==undefined)b.imageGalleries=sanitizeAlbumImageGalleries(b.imageGalleries)}catch(e){return sendJson(res,400,{error:e.message})}","if(b.imageGalleries!==undefined)b.imageGalleries=sanitizeAlbumImageGalleries(b.imageGalleries)}catch(e){return sendJson(res,e.status||400,{error:e.message,display:e.message.includes('gallery')||e.message.includes('color_images')?'عکس‌های گالری معتبر نیستند یا حجم مجموع آن‌ها زیاد است؛ تعداد عکس‌ها را کمتر کنید.':undefined})}");
server=once(server,'albumColorImages:b.colorImages??albumBase.colorImages??{}','albumColorImages:b.colorImages??albumBase.colorImages??{},albumImageGalleries:b.imageGalleries??albumBase.imageGalleries??{}');
server=once(server,'return applyAlbumColorImages({ enabled:','return applyAlbumColorImages({ imageGalleries:labPreferences.albumImageGalleries||{}, enabled:');fs.writeFileSync(path,server);
}
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(photobridge-r1380-album-editor\.css\?v=)[^"']+/g,'$1r1384').replace(/&flatAlbum=[^&"']*/g,'&flatAlbum=r1384');fs.writeFileSync(index,html);
