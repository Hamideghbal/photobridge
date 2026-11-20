'use strict';
// Mismatched verified UI variants must NOT hide the original walk-in entry
// script by turning a renderer JS request into HTTP 500.
function serve(source,transform,logger=console.warn){
 try {
  const rendered=transform(source);
  if(typeof rendered!=='string'||!rendered.includes('pb1137LocalIntakeButton'))throw Error('walkin_button_absent');
  new Function(rendered);
  return rendered;
 }catch(error){
  logger('[R1918] walk-in patch rejected; original UI retained: '+String(error?.message||'patch_failed').slice(0,100));
  return source;
 }
}
module.exports={serve};
