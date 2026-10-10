import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function sha256(file) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile()) out.push(p);
  }
  return out;
}

// ORT 1.21 Linux packages can contain two byte-identical libonnxruntime files.
// Replacing the versioned duplicate with a relative symlink keeps both loader names
// available while shrinking the final Docker image layer substantially.
export function deduplicateOnnxRuntime(ortRoot = path.join('node_modules', 'onnxruntime-node')) {
  try {
    const files = walk(ortRoot);
    const byDir = new Map();
    for (const f of files) {
      const base = path.basename(f);
      if (base === 'libonnxruntime.so.1' || /^libonnxruntime\.so\.1\.21(?:\.0)?$/.test(base)) {
        const d = path.dirname(f);
        if (!byDir.has(d)) byDir.set(d, []);
        byDir.get(d).push(f);
      }
    }
    let saved = 0;
    let deduped = 0;
    for (const [dir, group] of byDir) {
      const canonical = group.find(f => path.basename(f) === 'libonnxruntime.so.1');
      if (!canonical) continue;
      const cstat = fs.statSync(canonical);
      const chash = sha256(canonical);
      for (const f of group) {
        if (f === canonical) continue;
        const st = fs.statSync(f);
        if (st.size !== cstat.size || sha256(f) !== chash) continue;
        const name = path.basename(f);
        fs.unlinkSync(f);
        fs.symlinkSync(path.basename(canonical), f);
        saved += st.size;
        deduped += 1;
        console.log(`[PhotoBridge Liara Fast Build] ONNX duplicate deduped: ${path.join(dir, name)} -> ${path.basename(canonical)}`);
      }
    }
    if (deduped) {
      console.log(`[PhotoBridge Liara Fast Build] ONNX image slim: ${deduped} duplicate(s), ~${(saved / 1024 / 1024).toFixed(1)} MB saved before image commit.`);
    } else {
      console.log('[PhotoBridge Liara Fast Build] ONNX image slim: no duplicate Linux runtime pair found (safe to continue).');
    }
  } catch (e) {
    console.warn(`[PhotoBridge Liara Fast Build] ONNX image slim skipped: ${String(e?.message || e)}`);
  }
}
