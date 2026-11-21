'use strict';

const { setTimeout: delay } = require('node:timers/promises');

async function loadMountedUi({ window, origin, token, timeout = 12000 }) {
  const deadline = Date.now() + timeout;
  const abort = new AbortController();
  try {
    await Promise.race([
      window.loadURL(origin + '/start?token=' + token),
      delay(timeout, null, { signal: abort.signal }).then(() => {
        if (!window.isDestroyed()) window.webContents.stop();
        throw Error('native_ui_navigation_timeout');
      }),
    ]);
  } finally {
    abort.abort();
  }
  do {
    if (window.isDestroyed()) throw Error('native_ui_window_closed');
    if (!window.webContents.getURL().startsWith(origin + '/')) throw Error('native_ui_unexpected_origin');
    const mounted = await window.webContents.executeJavaScript(`Boolean(
      window.__PB_NATIVE_SOURCE_PROOF__ && document.getElementById('root')?.firstElementChild
    )`);
    if (mounted) return;
    await delay(100);
  } while (Date.now() < deadline);
  throw Error('native_ui_renderer_mount_timeout');
}

async function activateUi({ store, candidate, bundled, previousActive, selectRoot, validate, load, verifyBundled }) {
  const selectedBuild = store.get('uiBuild') || null;
  const candidates = [
    { root: candidate, build: selectedBuild },
    { root: previousActive, build: store.get('uiKnownGoodRoot') === previousActive ? store.get('uiKnownGoodBuild') : null },
    { root: bundled },
    { root: store.get('uiKnownGoodRoot'), build: store.get('uiKnownGoodBuild') },
    { root: store.get('uiPreviousRoot'), build: store.get('uiPreviousBuild') },
  ];
  const tried = new Set();
  let failure = null;
  for (const { root, build } of candidates) {
    if (!root || tried.has(root)) continue;
    tried.add(root);
    let activatedBuild = build || null;
    try {
      if (root === bundled) activatedBuild = verifyBundled().build;
      else validate(root);
      selectRoot(root);
      await load();
    } catch (error) {
      failure ||= error;
      if (root === candidate && root !== bundled && selectedBuild) store.set('uiFailedBuild', selectedBuild);
      continue;
    }
    store.transaction(() => {
      store.set('uiRoot', root);
      store.set('uiBuild', activatedBuild);
      store.set('uiKnownGoodRoot', root);
      store.set('uiKnownGoodBuild', activatedBuild);
      store.set('uiAppliedAt', new Date().toISOString());
      if (!failure && store.get('uiFailedBuild') === activatedBuild) store.set('uiFailedBuild', null);
      store.set('updateError', failure ? 'ui_activation_failed:' + failure.message : null);
    });
    return !failure;
  }
  throw failure || Error('native_ui_root_missing');
}

module.exports = { activateUi, loadMountedUi };
