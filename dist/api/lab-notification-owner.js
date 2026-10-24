const owners=new Map(),ttl=35000;
export function markNativeInfoOwner(labId,now=Date.now()){for(const [id,at] of owners)if(now-at>ttl)owners.delete(id);owners.set(String(labId),now);if(owners.size>10000)owners.delete(owners.keys().next().value)}
export function nativeInfoOwnerActive(labId,now=Date.now()){const at=owners.get(String(labId));return Number.isFinite(at)&&now>=at&&now-at<=ttl}
