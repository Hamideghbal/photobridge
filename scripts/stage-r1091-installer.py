#!/usr/bin/env python3
"""Split trusted Windows CI installer into git-storable chunks, with a checksum manifest."""
import hashlib, json, pathlib, sys
source=pathlib.Path(sys.argv[1])
out=pathlib.Path(sys.argv[2])
out.mkdir(parents=True,exist_ok=True)
name="PhotoBridge-Store-R1089-Setup-1.0.3-x64.exe"
if source.name!=name:
 raise SystemExit(f"Unexpected installer name: {source.name}")
size=source.stat().st_size
if not 100000000<=size<=200000000:raise SystemExit("Unexpected installer size")
chunk_size=24*1024*1024
parts=[]
digest=hashlib.sha256()
with source.open("rb") as src:
 for i in range(1,20):
  chunk=src.read(chunk_size)
  if not chunk:break
  digest.update(chunk)
  p=f"{name}.part{i:02d}"
  (out/p).write_bytes(chunk)
  parts.append(p)
with (out/"manifest.json").open("w",encoding="utf-8") as f:
 json.dump({"name":name,"size":size,"sha256":digest.hexdigest(),"parts":parts},f,indent=2)
 f.write("\n")
EXPECTED="6623b4c6679862038976619657d4f6a1daa2263517183a13ed7f20456c076005"
if digest.hexdigest()!=EXPECTED:
 raise SystemExit("Windows installer mismatch: refusing staging")
print("Prepared",len(parts),"durable parts",size,"bytes, sha256",digest.hexdigest())
