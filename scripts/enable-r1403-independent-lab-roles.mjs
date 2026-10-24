import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1403 changed anchor: '+a.slice(0,90));return s.replace(a,b)};
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1403 independent lab roles */')){
 s=once(s,'ON CONFLICT(lab_id,user_id) DO UPDATE SET active=true','ON CONFLICT(lab_id,user_id,role) DO UPDATE SET active=true');
 // Existing role predicates on auth, customer writes, finance, and deletion remain intact.
 // These two intake lookups previously fetched an arbitrary role for the pair.
 for(const columns of ['role,active','role,active,settlement_mode']){
  const pattern=new RegExp('SELECT '+columns+' FROM lab_memberships\\n(\\s*)WHERE lab_id=\\$1 AND user_id=\\$2 FOR UPDATE','g');
  if([...s.matchAll(pattern)].length!==1)throw Error('R1403 intake lookup changed');s=s.replace(pattern,(_,space)=>`SELECT ${columns} FROM lab_memberships\n${space}WHERE lab_id=$1 AND user_id=$2 AND role='customer' FOR UPDATE`);
 }
 s+='\n/* PB1403 independent lab roles */\n';fs.writeFileSync(file,s);
}
