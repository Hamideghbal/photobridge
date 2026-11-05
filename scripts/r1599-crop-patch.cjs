'use strict';
/* R1600: resilient crop warning patch for minified release bundles.
   R1599 incorrectly required one exact copy of the old crop confirm. */
const MARK='/* R1599 explicit crop cancellation / send confirmation */';
const PHOTO='if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!window.confirm(';
const ALBUM='if(Jt.length&&!we&&!window.confirm(';
const photoPrompt="'تعداد '+V(pbMismatch)+' فایل با سایز چاپ انتخاب‌شده تطبیق کامل ندارد. امکان لغو ارسال برای کراپ یا ارسال با همین وضعیت وجود دارد.'";
const albumPrompt="'تعداد '+V(Jt.length)+' فایل با سایز '+Be.label+' تطبیق کامل ندارد. امکان لغو ارسال برای کراپ یا ارسال با همین وضعیت وجود دارد.'";
function cropRegion(source,marker,startHint,endHint,label){
 const from=source.indexOf(startHint);
 if(from<0)throw new Error('R1600 '+label+' beginning missing: '+startHint);
 const end=source.indexOf(endHint,from);
 if(end<0||end-from>18000||end===from)
   throw new Error('R1600 '+label+' end missing or relocated: '+endHint);
 const region=source.slice(from,end);
 if(!region.includes(marker))throw new Error('R1600 '+label+' mismatch counter missing');
 return {from,end,region};
}
function replaceGuard(section,label,marker,expected,prompt){
 let body=section.region;
 const count=body.split(expected).length-1;
 if(count){
   // Replace all equivalent guards; a second copy is not a build failure.
   body=body.split(expected).join(
     expected.replace('window.confirm(', 'await pb1599ConfirmCropSend('));
 }else{
   // Older patches can rewrite the condition while preserving its consent.
   const pattern=new RegExp('if\\s*\\(\\s*'+marker+
     '(?:(?!;).){0,650}?(?:window\\.)?confirm\\s*\\(','g');
   const matches=[...body.matchAll(pattern)];
   if(matches.length){
     body=body.replace(pattern,match=>match.replace(/(?:window\.)?confirm\s*\($/,
       'await pb1599ConfirmCropSend('));
   }else{
     // No legacy prompt: require user consent immediately before the first
     // upload/order side effect. The stop anchor itself follows this region.
     const guard=label==='print'
       ?'if(pbMismatch&&!window.__photobridgePrintDelegateToLabV666&&!await pb1599ConfirmCropSend('+prompt+'))return;'
       :'if(Jt.length&&!we&&!await pb1599ConfirmCropSend('+prompt+'))return;';
     body+=guard;
   }
 }
 if(!body.includes('await pb1599ConfirmCropSend('))
   throw new Error('R1600 '+label+' confirmation not connected');
 return body;
}
function patchCrop(source){
 if(source.includes(MARK))return source;
 // Limit each change to its correct photographer upload handler.
 let photo=cropRegion(source,'pbMismatch','const pbMismatch=T.reduce(','const ue=new AbortController;','print');
 let changed=replaceGuard(photo,'print','pbMismatch',PHOTO,photoPrompt);
 source=source.slice(0,photo.from)+changed+source.slice(photo.end);
 let album=cropRegion(source,'Jt.length','xe=async()=>{','const gt=++dt.current','album');
 changed=replaceGuard(album,'album','Jt\\.length',ALBUM,albumPrompt);
 source=source.slice(0,album.from)+changed+source.slice(album.end);
 return source+'\n'+MARK+'\n';
}
module.exports={patchCrop,MARK,PHOTO,ALBUM};