'use strict';

const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { app, BrowserWindow, session } = require('electron');
const { createHost } = require('../host.cjs');
const { prepareNativeSession } = require('../native-session.cjs');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-electron-ui-'));
app.setPath('userData', profile);
const token = randomBytes(32).toString('hex');
const root = path.resolve(process.env.PB_ELECTRON_TEST_UI_ROOT || path.join(__dirname, '../verified-ui'));
const store = { get: () => null };
const server = createHost({
  store,
  token,
  roots: () => [root],
  isOnline: () => false,
  request: async () => { throw Error('offline'); },
});
const responses = new Map();
server.on('request', (req, res) => {
  res.once('finish', () => {
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    responses.set(pathname, res.statusCode);
  });
});
const timeout = setTimeout(() => {
  console.error('Timed out waiting for the Electron UI');
  app.exit(1);
}, 45000);

function request(url, headers) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, res => {
      res.setEncoding('utf8');
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function waitForMount(window) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const mounted = await window.webContents.executeJavaScript(`Boolean(
      document.querySelector('#root input[type=password]') &&
      window.__PB_NATIVE_SOURCE_PROOF__ &&
      window.__PB_LAB_DESKTOP_OVERLAY__ &&
      !document.documentElement.classList.contains('pbNativeFirstPaintPending') &&
      !document.getElementById('pbNativeFirstPaintDiagnostic')
    )`);
    if (mounted) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const state = await window.webContents.executeJavaScript(`({
    login: Boolean(document.querySelector('#root input[type=password]')),
    root: Boolean(document.querySelector('#root')?.firstElementChild),
    bundle: Boolean(window.__PB_NATIVE_SOURCE_PROOF__),
    overlay: Boolean(window.__PB_LAB_DESKTOP_OVERLAY__),
    firstPaint: document.documentElement.className
  })`);
  assert.fail('The real Electron Renderer did not mount and reveal the login UI: ' + JSON.stringify(state));
}

async function run() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = 'http://127.0.0.1:' + server.address().port;
  await prepareNativeSession(session.defaultSession, origin);
  const window = new BrowserWindow({
    width: 1440,
    height: 950,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, '../main-preload.cjs'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  await window.loadURL(origin + '/start?token=' + token);
  assert.equal(window.webContents.getURL(), origin + '/lab');
  await waitForMount(window);
  assert.equal(responses.get('/lab'), 200);
  assert.equal(await window.webContents.executeJavaScript(
    'document.querySelectorAll(\'link[rel="manifest"]\').length'
  ), 0, 'Native UI must not trigger an anonymous PWA manifest request');
  assert(!responses.has('/photobridge.webmanifest'));
  for (const name of ['/assets/index-UIRefine-v655-r84.js', '/desktop-overlay.js',
    '/native-storage.js', '/r1965-perf-client.js']) {
    assert.equal(responses.get(name), 200, name + ' during page load');
  }

  const { browserProof } = require('../ui-diagnostics.cjs');
  const proof = await window.webContents.executeJavaScript('(' + browserProof.toString() + ')()');
  assert.equal(proof['/index.html'].status, 200);
  assert.match(proof['/index.html'].contentType, /^text\/html\b/);
  assert.match(proof['/index.html'].sha256, /^[a-f0-9]{64}$/);
  const omitted = await window.webContents.executeJavaScript(`(async () => {
    const response = await fetch('/index.html', { credentials: 'omit' });
    return { status: response.status, body: await response.text() };
  })()`);
  assert.deepEqual(omitted, { status: 403, body: '{"error":"desktop_locked"}' });

  const assets = await window.webContents.executeJavaScript(`(async () => {
    const urls = new Map([['/index.html', 'html']]);
    for (const script of document.querySelectorAll('script[src]')) {
      if (new URL(script.src).origin === location.origin) {
        urls.set(script.src, script.type === 'module' ? 'module' : 'script');
      }
    }
    for (const link of document.querySelectorAll('link[rel=stylesheet],link[as=font]')) {
      if (new URL(link.href).origin === location.origin) {
        urls.set(link.href, link.as === 'font' ? 'font' : 'css');
      }
    }
    return Promise.all([...urls].map(async ([url, type]) => {
      const response = await fetch(url, { cache: 'no-store' });
      return {
        path: new URL(url, location.origin).pathname,
        type,
        status: response.status,
        mime: response.headers.get('content-type'),
        bytes: (await response.clone().arrayBuffer()).byteLength,
        source: type === 'module' || type === 'script' ? await response.text() : null
      };
    }));
  })()`);
  const mime = {
    html: /^text\/html\b/,
    script: /^(text|application)\/javascript\b/,
    module: /^(text|application)\/javascript\b/,
    css: /^text\/css\b/,
    font: /^font\//,
  };
  assert(assets.some(asset => asset.path === '/assets/index-UIRefine-v655-r84.js'));
  for (const asset of assets) {
    assert.equal(asset.status, 200, asset.path);
    assert.match(asset.mime, mime[asset.type], asset.path);
    assert(asset.bytes > 0, asset.path);
  }
  for (const { path: name, type, source } of assets) {
    if (source === null) continue;
    const checked = spawnSync(process.execPath, ['--check', '--input-type=' + (type === 'module' ? 'module' : 'commonjs')], {
      input: source,
      encoding: 'utf8',
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    });
    assert.ifError(checked.error);
    assert.equal(checked.status, 0, name + '\n' + checked.stderr);
  }

  for (const name of new Set(assets.map(asset => asset.path))) {
    const denied = await request(origin + name);
    assert.deepEqual(denied, { status: 403, body: '{"error":"desktop_locked"}' }, name);
  }
  assert.deepEqual(await request(origin + '/index.html', { Host: 'localhost:' + server.address().port }), {
    status: 403, body: '{"error":"invalid_host"}',
  });
  assert.deepEqual(await request(origin + '/index.html', {
    Cookie: 'desktop=' + token, Origin: 'https://example.invalid',
  }), { status: 403, body: '{"error":"invalid_origin"}' });
  assert.deepEqual(await request(origin + '/start?token=invalid'), {
    status: 403, body: '{"error":"desktop_locked"}',
  });
  console.log('Electron UI mounted. Verified ' + assets.length + ' assets, served JavaScript syntax and HTTP access controls.');
  window.destroy();
}

let exitCode = 0;
app.whenReady().then(run).catch(error => {
  console.error(error);
  exitCode = 1;
}).finally(() => {
  clearTimeout(timeout);
  server.close();
  app.exit(exitCode);
});
process.once('exit', () => {
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
});
