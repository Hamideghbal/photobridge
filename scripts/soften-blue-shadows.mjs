// Change decorative blue shadows only; preserve text, focus rings and status colors.
export function softenBlue(value){
 return value.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([.\d]+))?\s*\)/gi,(all,r,g,b,a)=>{
  r=Number(r);g=Number(g);b=Number(b);
  if(b-r<35||b-g<25)return all;
  const grey=(r+g+b)/3;
  return `rgba(${Math.round(r*.75+grey*.25)},${Math.round(g*.75+grey*.25)},${Math.round(b*.75+grey*.25)},${Math.round(Number(a??1)*.6*1000)/1000})`;
 });
}
export function softenCss(css){
 const marker='/* PB1364 softer blue shadows */';
 if(css.includes(marker))return css;
 return css.replace(/([^{}]+)\{([^{}]*)\}/g,(rule,selector,body)=>{
  const next=body.replace(/((?:box-shadow|text-shadow)\s*:\s*)([^;{}]+)/gi,(_,key,value)=>key+softenBlue(value));
  const fade=/fade|glow/i.test(selector)?next.replace(/(background(?:-image)?\s*:\s*)([^;{}]+)/gi,(_,key,value)=>key+softenBlue(value)):next;
  return selector+'{'+fade+'}';
 })+'\n'+marker+'\n';
}
