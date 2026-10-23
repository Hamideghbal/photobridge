export function sanitizeAlbumColorImages(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Object.assign(Error('album_color_images_invalid'),{status:400});const result={cover:Object.create(null),package:Object.create(null)};let total=0,count=0;
 for(const kind of ['cover','package'])if(input[kind]!=null&&(typeof input[kind]!=='object'||Array.isArray(input[kind])))throw Object.assign(Error('album_color_images_invalid'),{status:400});
 for(const kind of ['cover','package'])for(const [title,colors] of Object.entries(input[kind]||{})){if(!title.trim()||title.length>100||!colors||typeof colors!=='object'||Array.isArray(colors))throw Object.assign(Error('album_color_images_invalid'),{status:400});const out=Object.create(null);for(const [hex,data]of Object.entries(colors)){if(!/^#[0-9a-f]{6}$/i.test(hex)||typeof data!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(data)||data.length>200000)throw Object.assign(Error('album_color_images_invalid'),{status:400});const buffer=Buffer.from(data.slice(data.indexOf(',')+1),'base64');if(!(buffer[0]===255&&buffer[1]===216&&buffer[2]===255||buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP'))throw Object.assign(Error('album_color_images_invalid'),{status:400});total+=data.length;count++;if(total>4000000||count>120)throw Object.assign(Error('album_color_images_too_large'),{status:413});out[hex.toUpperCase()]=data;}result[kind][title]=out;}return result;
}
export function applyAlbumColorImages(catalog,images={}){
 const title=(a,b)=>!b||b==='استاندارد'||a===b?a:b.startsWith(a)&&a?b:[a,b].filter(Boolean).join(' · ');
 const lookup=(kind,name,hex)=>images?.[kind]?.[name]?.[String(hex||'').toUpperCase()]||'';
 for(const variant of catalog.coverCatalog?.variants||[]){const m=catalog.coverCatalog.materials.find(m=>String(m.id)===String(variant.materialId)),t=catalog.coverCatalog.types.find(t=>String(t.id)===String(variant.typeId));if(m&&t)t.paletteImages={...t.paletteImages,...images.cover?.[title(m.name,t.name)]};}
 for(const cover of catalog.covers||[])for(const color of cover.colors||[])color.imageData=lookup('cover',title(cover.materialName,cover.modelName),color.colorValue);
 for(const model of catalog.packageCatalog?.models||[])for(const color of model.colors||[])color.imageData=lookup('package',title(model.materialName==='کیف / باکس'?'':model.materialName,model.modelName),color.colorValue);
 for(const pkg of catalog.packages||[]){const image=lookup('package',pkg.modelName,pkg.colorValue);if(image)pkg.imageData=image;}
 catalog.colorImages=images;return catalog;
}
