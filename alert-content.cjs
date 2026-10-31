'use strict';
function imageUrl(value){
 if(typeof value!=='string'||value.length>4096)return null;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}
}
function alertContent(n){
 const meta=n.metadata&&typeof n.metadata==='object'?n.metadata:{};
 const image=imageUrl(n.image_url||n.imageUrl||meta.image_url||meta.imageUrl||meta.attachmentUrl);
 return {created_at:n.created_at||null,id:String(n.id),title:String(n.title||'اعلان جدید'),message:String(n.message||''),...(image?{image}:{}),...(n.attachment_key?{hasAttachment:true}:{} )};
}
module.exports={imageUrl,alertContent};
