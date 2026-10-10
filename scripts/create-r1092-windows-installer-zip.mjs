// R1092: package the already SHA-256 verified EXE into a standard single-file ZIP.
// Uses ZIP method 0 (stored), not deflate: EXE setup data is already compressed.
// Streams a bounded buffer and keeps the ZIP reproducible without extra dependencies.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const dir=path.join(root,'dist','installer-source','store-r1089');
const manifest=path.join(dir,'manifest.json');
if (!fs.existsSync(manifest)) {
  console.log('[PhotoBridge R1092] No installer source; ZIP packaging skipped.');
} else {
  const spec=JSON.parse(fs.readFileSync(manifest,'utf8'));
  const exe=path.join(root,'dist','web','downloads','store-desktop',spec.name);
  const zipName=spec.name.replace(/\.exe$/i,'.zip');
  const output=path.join(path.dirname(exe),zipName);
  if (!/\.exe$/i.test(spec.name)||!fs.existsSync(exe)||fs.statSync(exe).size!==spec.size
      ||spec.size>=0xFFFFFFFF||spec.size<10_000_000) throw Error('[R1092] Missing or invalid source setup EXE');
  const fname=Buffer.from(spec.name,'utf8');
  if(fname.length>0xFFFF)throw Error('ZIP filename too long');
  const block=Buffer.allocUnsafe(256*1024);
  const crcTable=new Uint32Array(256);
  for(let i=0;i<256;i++){
    let v=i;
    for(let j=0;j<8;j++)v=(v&1)?((v>>>1)^0xEDB88320):(v>>>1);
    crcTable[i]=v>>>0;
  }
  let crc=0xFFFFFFFF,bytes=0;
  const inp=fs.openSync(exe,'r');
  try{
    let n;
    while((n=fs.readSync(inp,block,0,block.length,null))>0){
      for(let i=0;i<n;i++)crc=crcTable[(crc^block[i])&255]^(crc>>>8);
      bytes+=n;
    }
  }finally{fs.closeSync(inp)}
  crc=(crc^0xFFFFFFFF)>>>0;
  if(bytes!==spec.size)throw Error('Setup changed during CRC pass');
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034B50,0);local.writeUInt16LE(20,4);
  local.writeUInt16LE(0x0800,6);local.writeUInt16LE(0,8); // UTF-8, stored
  local.writeUInt16LE(0,10);local.writeUInt16LE(0x21,12); // 1980-01-01
  local.writeUInt32LE(crc,14);local.writeUInt32LE(spec.size,18);
  local.writeUInt32LE(spec.size,22);local.writeUInt16LE(fname.length,26);
  const central=Buffer.alloc(46);
  central.writeUInt32LE(0x02014B50,0);
  central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
  central.writeUInt16LE(0x0800,8);central.writeUInt16LE(0,10);
  central.writeUInt16LE(0,12);central.writeUInt16LE(0x21,14);
  central.writeUInt32LE(crc,16);central.writeUInt32LE(spec.size,20);
  central.writeUInt32LE(spec.size,24);central.writeUInt16LE(fname.length,28);
  const centralStart=local.length+fname.length+spec.size;
  const centralSize=central.length+fname.length;
  const eocd=Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054B50,0);
  eocd.writeUInt16LE(1,8);eocd.writeUInt16LE(1,10);
  eocd.writeUInt32LE(centralSize,12);eocd.writeUInt32LE(centralStart,16);
  const temp=output+'.tmp';
  const dst=fs.openSync(temp,'w');
  const src=fs.openSync(exe,'r');
  let done=false;
  try{
    fs.writeSync(dst,local);fs.writeSync(dst,fname);
    let total=0,n;
    while((n=fs.readSync(src,block,0,block.length,null))>0){
      fs.writeSync(dst,block,0,n);
      total+=n;
    }
    if(total!==spec.size)throw Error('Setup changed during ZIP copy');
    fs.writeSync(dst,central);fs.writeSync(dst,fname);fs.writeSync(dst,eocd);
    fs.fsyncSync(dst);
    done=true;
  }finally{
    fs.closeSync(src);fs.closeSync(dst);
    if(!done)fs.rmSync(temp,{force:true});
  }
  if(fs.statSync(temp).size!==spec.size+local.length+central.length+eocd.length+fname.length*2){
    fs.rmSync(temp,{force:true});throw Error('ZIP byte count mismatch');
  }
  fs.renameSync(temp,output);
  const hash=crypto.createHash('sha256');
  for await(const chunk of fs.createReadStream(output))hash.update(chunk);
  const zipHash=hash.digest('hex');
  fs.writeFileSync(path.join(path.dirname(exe),'SHA256SUMS.txt'),
    spec.sha256+'  '+spec.name+'\n'+zipHash+'  '+zipName+'\n');
  console.log('[PhotoBridge R1092] Durable download ZIP ready:',zipName,fs.statSync(output).size,zipHash);
}
