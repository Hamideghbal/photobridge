'use strict';
const {alertContent}=require('./alert-content.cjs');
// Chat requests use the existing authenticated request helper, including while hidden.
async function collectChatAlerts({store,request,account,userId,now}){
 const key='nativeChatChecked:'+account;
 const since=store.get(key);
 if(!since){store.set(key,now);return {items:[],checkpoint:now,key}}
 const json=async path=>{const r=await request(path);if(!r.ok)throw Error('chat_poll_failed');return r.json()};
 const [platform,contacts]=await Promise.all([json('/api/lab/platform-chat'),json('/api/lab/chat/contacts')]);
 const items=[];
 function add(messages,contact){for(const m of messages||[]){const time=Date.parse(m.created_at);if(!m.id||!Number.isFinite(time)||time<since||m.sender_id===userId)continue;if(contact&&m.sender_id!==contact.id)continue;items.push(alertContent({...m,id:'chat:'+m.id,title:contact?'پیام از '+contact.name:'پیام از '+(m.sender_name||'پشتیبانی'),imageUrl:m.image_url||m.imageUrl}));}}
 add(platform.messages);
 for(const contact of contacts.contacts||[]){
  if(!/^[0-9a-f-]{36}$/i.test(String(contact.id))||Date.parse(contact.last_message_at)<since)continue;
  const data=await json('/api/lab/chat/'+encodeURIComponent(contact.id));add(data.messages,contact);
 }
 return {items,key,checkpoint:now};
}
module.exports={collectChatAlerts};
