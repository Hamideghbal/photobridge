export function latestLabChats(server){
 const sections=[
  ["if (labChat && req.method === 'GET') {", "if (labChat && req.method === 'POST') {", 'cm.created_at ASC LIMIT 500','cm.created_at DESC LIMIT 500'],
  ["if (req.method === 'GET' && url.pathname === '/api/lab/platform-chat') {", "if (req.method === 'POST' && url.pathname === '/api/lab/platform-chat') {", 'm.created_at ASC LIMIT 300','m.created_at DESC LIMIT 300']
 ];
 for(const [start,end,before,after] of sections){
  const a=server.indexOf(start),b=server.indexOf(end,a);
  if(a<0||b<0)throw Error('R1364 chat route missing');
  const section=server.slice(a,b);
  if(section.includes(after)&&section.includes('messages: q.rows.reverse()'))continue;
  if(section.split(before).length!==2||section.split('messages: q.rows').length!==2)throw Error('R1364 chat query changed');
  server=server.slice(0,a)+section.replace(before,after).replace('messages: q.rows','messages: q.rows.reverse()')+server.slice(b);
 }
 return server;
}
