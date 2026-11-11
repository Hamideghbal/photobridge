/* R1791: lab-defined Latin model filename labels and linked name dialogs.
 * R1777 adds the base frame photo/color icon; R1789 pairs stock/price columns.
 * Run last to keep website, Windows Lab snapshot and manifest consistent. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{const count=s.split(a).length-1;if(count!==1)throw Error('[R1791] '+label+' anchor '+count);return s.replace(a,b)};
const section=(s,beg,end,patch,label)=>{const a=s.indexOf(beg),b=a<0?-1:s.indexOf(end,a+beg.length);if(a<0||b<=a)throw Error('[R1791] '+label+' bounds');return s.slice(0,a)+patch(s.slice(a,b))+s.slice(b)};
const modelDialog=String.raw