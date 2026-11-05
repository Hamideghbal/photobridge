'use strict';
const MARK='/* R1599 explicit crop cancellation / send confirmation */';
const PHOTO='if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!window.confirm(';
const ALBUM='if(Jt.length&&!we&&!window.confirm(';
function patchCrop(source){
 if(source.includes(MARK))return source;
 for(const [before,after] of [
  [PHOTO,'if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!await pb1599ConfirmCropSend('],
  [ALBUM,'if(Jt.length&&!we&&!await pb1599ConfirmCropSend(']
 ]){
  if(source.split(before).length!==2)throw Error('R1599 crop guard missing or ambiguous: '+before);
  source=source.replace(before,after);
 }
 return source+'\n'+MARK+'\n';
}
module.exports={patchCrop,MARK,PHOTO,ALBUM};