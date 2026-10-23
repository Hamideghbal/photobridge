function PB1376InviteUrl(invite){
 try{const url=new URL(invite.shareUrl);if(!/^https?:$/.test(url.protocol)||url.pathname!=='/photographer/signup'||url.searchParams.get('invite')!==String(invite.code))throw Error('invalid_invite_url');return url.href}catch{}
 const base=typeof location!=='undefined'&&/^https?:$/.test(location.protocol)?location.origin:'https://photobridge.ir';return new URL('/photographer/signup?invite='+encodeURIComponent(String(invite.code||'')),base).href;
}
async function PB1376CopyInvite(url){
 try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);return true}}catch{}
 const previous=document.activeElement,input=document.createElement('textarea');input.value=url;input.readOnly=true;input.style.position='fixed';input.style.left='-10000px';input.style.top='0';input.setAttribute('aria-label','لینک دعوت');document.body.append(input);
 try{input.focus();input.select();input.setSelectionRange?.(0,url.length);return document.execCommand?.('copy')===true}catch{return false}finally{input.remove();previous?.focus?.()}
}
