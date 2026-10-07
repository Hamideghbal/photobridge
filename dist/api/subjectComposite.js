// A generated scene never contributes pixels to the protected subject.
export const PRINT_WIDTH=3543, PRINT_HEIGHT=4724, PRINT_DPI=300;
export function validateOutline(value){
  if(!Array.isArray(value)||value.length<8||value.length>160)throw Error('outline_requires_8_to_160_points');
  const points=value.map(p=>[Number(p?.[0]),Number(p?.[1])]);
  if(points.some(([x,y])=>!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1000||y<0||y>1000))throw Error('invalid_outline_point');
  const area=Math.abs(points.reduce((sum,[x,y],i)=>{const [nx,ny]=points[(i+1)%points.length];return sum+x*ny-nx*y},0))/2;
  if(area<10000||area>950000)throw Error('invalid_outline_area');
  return points;
}
export function subjectPlacement(bounds,sourceWidth,sourceHeight,targetWidth=PRINT_WIDTH,targetHeight=PRINT_HEIGHT){
  const box={left:Math.max(0,Math.floor(bounds.left)),top:Math.max(0,Math.floor(bounds.top)),width:Math.ceil(bounds.width),height:Math.ceil(bounds.height)};
  if(box.width<1||box.height<1||box.left+box.width>sourceWidth||box.top+box.height>sourceHeight)throw Error('outline_outside_source');
  const scale=Math.min(1,(targetWidth*.94)/box.width,(targetHeight*.94)/box.height);
  const width=Math.max(1,Math.round(box.width*scale)),height=Math.max(1,Math.round(box.height*scale));
  return {...box,scale,width,height,x:Math.round((targetWidth-width)/2),y:Math.round(targetHeight*.97-height)};
}
export async function composeProtectedSubject({sharp,source,background,outline}){
  const points=validateOutline(outline);
  const original=await sharp(source).rotate().png().toBuffer();
  const metadata=await sharp(original).metadata(),W=metadata.width,H=metadata.height;
  if(!W||!H||W*H>100_000_000)throw Error('source_dimensions_unsupported');
  const pixels=points.map(([x,y])=>[x*W/1000,y*H/1000]);
  const xx=pixels.map(p=>p[0]),yy=pixels.map(p=>p[1]);
  const bounds={left:Math.max(0,Math.floor(Math.min(...xx))-3),top:Math.max(0,Math.floor(Math.min(...yy))-3),width:0,height:0};
  bounds.width=Math.min(W-bounds.left,Math.ceil(Math.max(...xx))+3-bounds.left);
  bounds.height=Math.min(H-bounds.top,Math.ceil(Math.max(...yy))+3-bounds.top);
  const place=subjectPlacement(bounds,W,H);
  const relative=pixels.map(([x,y])=>`${(x-bounds.left).toFixed(2)},${(y-bounds.top).toFixed(2)}`).join(' ');
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}"><polygon points="${relative}" fill="white"/></svg>`);
  const mask=await sharp(svg).blur(1).png().toBuffer();
  const crop=await sharp(original).extract(bounds).removeAlpha().joinChannel(mask).png().toBuffer();
  const cutout=place.scale===1?crop:await sharp(crop).resize(place.width,place.height).png().toBuffer();
  const backdrop=await sharp(background).rotate().resize(PRINT_WIDTH,PRINT_HEIGHT,{fit:'cover',position:'centre'}).toColourspace('srgb').png().toBuffer();
  const output=await sharp(backdrop).composite([{input:cutout,left:place.x,top:place.y}]).withMetadata({density:PRINT_DPI}).png({compressionLevel:6}).toBuffer();
  return {buffer:output,sourceWidth:W,sourceHeight:H,subjectScale:place.scale,pixelPreservedInside:place.scale===1,placement:place};
}
