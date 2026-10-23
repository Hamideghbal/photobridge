import {sanitizeAlbumColorImages} from './album-color-images.js';
export function sanitizeAlbumImageGalleries(input){
 const invalid=()=>{throw Object.assign(Error('album_image_gallery_invalid'),{status:400})};
 if(!input||typeof input!=='object'||Array.isArray(input))invalid();const result={cover:Object.create(null),package:Object.create(null)},flat=Object.create(null);let count=0,total=0;
 const list=value=>{if(!Array.isArray(value)||value.length>12)invalid();return value.map(data=>{total+=typeof data==='string'?data.length:0;if(total>3000000)throw Object.assign(Error('album_image_gallery_too_large'),{status:413});flat[String(count++)]={'#000000':data};return data})};
 for(const kind of ['cover','package']){const models=input[kind]??{};if(typeof models!=='object'||Array.isArray(models))invalid();for(const[title,entry]of Object.entries(models)){if(!title.trim()||title.length>100||!entry||typeof entry!=='object'||Array.isArray(entry))invalid();const colors=entry.colors??{};if(typeof colors!=='object'||Array.isArray(colors))invalid();const out={model:list(entry.model??[]),colors:Object.create(null)};for(const[hex,images]of Object.entries(colors)){if(!/^#[0-9a-f]{6}$/i.test(hex))invalid();out.colors[hex.toUpperCase()]=list(images)}result[kind][title]=out;}}
 sanitizeAlbumColorImages({cover:flat,package:{}});return result;
}
