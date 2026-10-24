import crypto from 'node:crypto';
export const MAX_VOICE_BYTES=1024*1024;
export function decodeVoice(input){
 const mime=String(input?.mime||'').split(';')[0].toLowerCase();
 if(!['audio/webm','audio/ogg','audio/mp4'].includes(mime))throw Object.assign(Error('voice_format_invalid'),{status:400});
 const encoded=input?.data;
 if(typeof encoded!=='string'||!encoded.length||encoded.length>Math.ceil(MAX_VOICE_BYTES/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))throw Object.assign(Error('voice_size_invalid'),{status:400});
 const buffer=Buffer.from(encoded,'base64');if(buffer.toString('base64')!==encoded)throw Object.assign(Error('voice_format_invalid'),{status:400});
 const valid=mime==='audio/webm'?buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):mime==='audio/ogg'?buffer.subarray(0,4).toString()==='OggS':buffer.subarray(4,8).toString()==='ftyp';
 if(buffer.length<16||buffer.length>MAX_VOICE_BYTES||!valid)throw Object.assign(Error('voice_format_invalid'),{status:400});
 return {buffer,mime,ext:{'audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a'}[mime]};
}
export function voiceRows(rows,issue){return rows.map(row=>{const match=String(row.attachment_key||'').match(/\/chat-voice\/[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\.(webm|ogg|m4a)$/i);return match?{...row,voiceUrl:issue(row.attachment_key,'voice.'+match[1],{webm:'audio/webm',ogg:'audio/ogg',m4a:'audio/mp4'}[match[1]])}:row})}
export async function saveChatVoice({input,labId,customerId,senderId,pool,store,remove}){
 const voice=decodeVoice(input),rel=`chat-voice/${labId}/${customerId}/${crypto.randomUUID()}.${voice.ext}`;
 const key=await store(rel,voice.buffer,voice.mime);
 try{const q=await pool.query('INSERT INTO chat_messages(lab_id,sender_id,customer_id,message,attachment_key) VALUES($1,$2,$3,$4,$5) RETURNING *',[labId,senderId,customerId,'پیام صوتی',key]);return q.rows[0]}
 catch(error){await remove(key).catch(()=>{});throw error}
}
