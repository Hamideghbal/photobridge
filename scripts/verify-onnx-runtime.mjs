import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const npmrc = fs.readFileSync(path.join(root, '.npmrc'), 'utf8');
if (!/^onnxruntime-node-install=skip$/m.test(npmrc)) {
  console.error('[PhotoBridge Deploy Lite] v730 ONNX install guard missing: onnxruntime-node-install=skip');
  process.exit(2);
}

const ortDir = path.join(root, 'node_modules', 'onnxruntime-node');
if (!fs.existsSync(ortDir)) {
  console.log('[PhotoBridge Deploy Lite] v730 ONNX CPU preflight skipped locally (node_modules is not bundled in the deploy ZIP).');
  process.exit(0);
}

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ortDir, 'package.json'), 'utf8'));
  if (String(pkg.version || '') !== '1.21.0') {
    throw new Error(`unexpected onnxruntime-node version ${pkg.version || 'unknown'}`);
  }
  const entry = path.join(ortDir, pkg.main || 'dist/index.js');
  const ort = await import(pathToFileURL(entry).href);
  if (typeof ort?.InferenceSession?.create !== 'function' || typeof ort?.Tensor !== 'function') {
    throw new Error('CPU binding did not expose InferenceSession/Tensor');
  }
  console.log('[PhotoBridge Deploy Lite] v730 verified: ONNX Runtime 1.21.0 CPU binding loads without the optional CUDA/network install step.');
} catch (error) {
  console.error('[PhotoBridge Deploy Lite] v730 ONNX CPU preflight failed:', error?.stack || error);
  process.exit(3);
}
