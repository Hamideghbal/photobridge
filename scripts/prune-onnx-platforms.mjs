import fs from 'node:fs';
import path from 'node:path';
import { deduplicateOnnxRuntime } from './deduplicate-onnx-runtime.mjs';

if (process.platform !== 'linux') {
  throw new Error(`Liara runtime pruning requires Linux, received ${process.platform}`);
}
if (!['x64', 'arm64'].includes(process.arch)) {
  throw new Error(`Unsupported Linux runtime architecture: ${process.arch}`);
}

const packageRoot = path.join('node_modules', 'onnxruntime-node', 'bin', 'napi-v3');
const keep = path.join(packageRoot, process.platform, process.arch);
const required = ['onnxruntime_binding.node', 'libonnxruntime.so.1'];
if (!fs.existsSync(keep)) throw new Error(`ONNX Runtime native package missing for ${process.platform}/${process.arch}`);
for (const name of required) {
  if (!fs.existsSync(path.join(keep, name))) throw new Error(`ONNX Runtime ${process.platform}/${process.arch} is missing ${name}`);
}

function bytes(dir) {
  let total = 0;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) total += bytes(file);
    else if (item.isFile()) total += fs.statSync(file).size;
  }
  return total;
}

const before = bytes(packageRoot);
for (const platform of fs.readdirSync(packageRoot)) {
  const platformDir = path.join(packageRoot, platform);
  if (!fs.statSync(platformDir).isDirectory()) continue;
  if (platform !== process.platform) {
    fs.rmSync(platformDir, { recursive: true, force: true });
    continue;
  }
  for (const arch of fs.readdirSync(platformDir)) {
    if (arch !== process.arch) fs.rmSync(path.join(platformDir, arch), { recursive: true, force: true });
  }
}
const after = bytes(packageRoot);
console.log(`[PhotoBridge Docker] ONNX Runtime kept ${process.platform}/${process.arch}; removed ${((before - after) / 1024 / 1024).toFixed(1)} MB of unused platform binaries.`);

// Finish native preparation before Docker commits the dependency layer.
deduplicateOnnxRuntime();
