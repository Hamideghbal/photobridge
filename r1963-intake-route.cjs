'use strict';
// Native-only; the website's walk-in launcher is unchanged.
function scopeManualButton(source){
 if(typeof source!=='string')throw Error('native_intake_not_text');
 if(source.includes('R1963_NATIVE_PRINT_TAB_ONLY')||!source.includes('pb1137LocalIntakeButton'))return source;
 const anchors=[
  'if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host){old?.remove();return;}',
  'if(!/^\\/lab(?:\\/|$)/.test(location.pathname)||!host||!provider){old?.remove();return;}'
 ];
 const found=anchors.filter(x=>source.includes(x));if(found.length!==1)throw Error('native_manual_button_route_mismatch');
 const allowed='/* R1963_NATIVE_PRINT_TAB_ONLY */if(!/^\\/lab(?:$|\\/(?:orders|print|albums?)(?:\\/|$))/.test(location.pathname)||!host){old?.remove();return;}';
 return source.replace(found[0],allowed);
}
module.exports={scopeManualButton};
