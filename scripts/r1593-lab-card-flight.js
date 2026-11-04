/* R1594 — Lab-only order card flight. Snapshot at the click, fly after success.
   The card and the current status tab are independent; no navigation is triggered. */
(function () {
  'use strict';
  if (window.PB1594LabCardFlight) return;
  window.PB1594LabCardFlight = true;

  var last = null;
  var active = new Set();
  var stageLabels = { ready: 'آماده تحویل', completed: 'تحویل شده' };
  function normalize(value) {
    return String(value || '').replace(/[\u200c\u200f\s\d۰-۹٠-٩()[\]{}:·•#،\-–]/g, '');
  }
  function inLabQueue() {
    return /^\/lab\/(?:orders|album)(?:\/|$)/.test(location.pathname) &&
      !!document.querySelector('.labRoleWorkspace');
  }
  function root() {
    return document.querySelector('#root .labRoleWorkspace') ||
      document.querySelector('.labRoleWorkspace');
  }
  function stageOf(button) {
    var key = button.getAttribute('data-pb1578-stage') || '';
    if (key === 'ready' || key === 'completed') return key;
    var text = normalize(button.textContent);
    if (text.includes('آمادهتحویل')) return 'ready';
    if (text.includes('تحویلشد') || text.includes('تحویلشده')) return 'completed';
    return '';
  }
  function capture(event) {
    if (!inLabQueue()) return;
    var button = event.target && event.target.closest && event.target.closest('button');
    if (!button || button.disabled || button.closest('[aria-hidden="true"]')) return;
    var card = button.closest('.labOrderCard');
    if (!card) return;
    var stage = stageOf(button);
    if (!stage) return;
    var rect = card.getBoundingClientRect();
    if (rect.width < 70 || rect.height < 24) return;
    // Preserve the original DOM BEFORE React removes/replaces the source card.
    // Never rely on card.isConnected after the status request resolves.
    last = {
      card: card, stage: stage, at: Date.now(),
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      clone: card.cloneNode(true)
    };
    window.PB1594LabFlightDiagnostic = 'captured:' + stage;
  }
  document.addEventListener('pointerdown', capture, true);
  document.addEventListener('click', capture, true); // keyboard and synthetic clicks

  function findTab(stage) {
    var workspace = root();
    if (!workspace || !stageLabels[stage]) return null;
    var label = normalize(stageLabels[stage]);
    var candidates = workspace.querySelectorAll(
      '.pb1148SecondaryHeader button,.mainQueueFilters button,.pb1372ThirdHeader button,[role="tab"]'
    );
    var tab = Array.from(candidates).find(function (button) {
      return !button.closest('.labOrderCard') &&
        button.getClientRects().length > 0 &&
        normalize(button.textContent).includes(label);
    });
    if (tab) return tab;
    return Array.from(workspace.querySelectorAll('button')).find(function (button) {
      var bounds = button.getBoundingClientRect();
      return !button.closest('.labOrderCard') && bounds.width > 20 &&
        bounds.height > 10 && normalize(button.textContent).includes(label);
    }) || null;
  }

  function pulse(target) {
    if (!target || !target.isConnected) return;
    try {
      if (typeof target.animate === 'function') {
        target.animate([
          { boxShadow: '0 0 0 0 rgba(57,117,210,.36)', opacity: 1 },
          { boxShadow: '0 0 0 9px rgba(57,117,210,.22)', opacity: 1 },
          { boxShadow: '0 0 0 0 rgba(57,117,210,0)', opacity: 1 }
        ], { duration: 540, easing: 'ease-out' });
      }
    } catch (_) {}
  }

  // Reconstruct the card's original ancestor classes so the flying copy keeps
  // its authentic Lab card styling even when the source has unmounted.
  function makeShell(snapshot, workspace) {
    var shell = document.createElement('div');
    shell.setAttribute('aria-hidden', 'true');
    shell.className = 'pb1594FlightShell';
    var declarations = {
      position: 'fixed', left: snapshot.rect.left + 'px',
      top: snapshot.rect.top + 'px',
      width: snapshot.rect.width + 'px',
      height: snapshot.rect.height + 'px',
      margin: '0', padding: '0', overflow: 'visible',
      pointerEvents: 'none', zIndex: '2147483000',
      transformOrigin: 'center center', opacity: '1'
    };
    Object.keys(declarations).forEach(function (key) {
      shell.style.setProperty(key.replace(/[A-Z]/g, function (c) {
        return '-' + c.toLowerCase();
      }), declarations[key], 'important');
    });

    var clone = snapshot.clone;
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    clone.style.setProperty('content-visibility', 'visible', 'important');
    clone.style.setProperty('contain', 'none', 'important');
    clone.style.setProperty('pointer-events', 'none', 'important');
    clone.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
    clone.querySelectorAll('button,a,input,select,textarea,[tabindex]').forEach(function (node) {
      node.setAttribute('tabindex', '-1');
      if ('disabled' in node) node.disabled = true;
    });

    var hierarchy = clone;
    var cursor = snapshot.card.parentElement;
    var depth = 0;
    while (cursor && cursor !== workspace && depth++ < 9) {
      var wrapper = document.createElement('div');
      wrapper.className = (typeof cursor.className === 'string' ? cursor.className : '');
      wrapper.style.setProperty('display', 'contents', 'important');
      wrapper.style.setProperty('overflow', 'visible', 'important');
      wrapper.appendChild(hierarchy);
      hierarchy = wrapper;
      cursor = cursor.parentElement;
    }
    shell.appendChild(hierarchy);
    workspace.appendChild(shell);
    // Fixed descendants can be offset by a transformed workspace. Compensate.
    var located = shell.getBoundingClientRect();
    shell.style.setProperty('left', snapshot.rect.left * 2 - located.left + 'px', 'important');
    shell.style.setProperty('top', snapshot.rect.top * 2 - located.top + 'px', 'important');
    return shell;
  }

  function onConfirmed(event) {
    var stage = event.detail && event.detail.to;
    if (!inLabQueue() || !stageLabels[stage]) return;
    var snapshot = last;
    if (!snapshot || snapshot.stage !== stage || Date.now() - snapshot.at > 120000) {
      window.PB1594LabFlightDiagnostic = 'missing-snapshot:' + stage;
      return;
    }
    last = null;
    var tab = findTab(stage);
    var workspace = root();
    if (!tab || !workspace) {
      window.PB1594LabFlightDiagnostic = 'missing-tab:' + stage;
      return;
    }
    var target = tab.getBoundingClientRect();
    if (target.width < 8 || target.height < 8) return;
    var shell;
    try {
      shell = makeShell(snapshot, workspace);
      active.add(shell);
      if (snapshot.card.isConnected) snapshot.card.style.setProperty('visibility', 'hidden', 'important');
      var origin = snapshot.rect;
      var dx = (target.left + target.width / 2) - (origin.left + origin.width / 2);
      var dy = (target.top + target.height / 2) - (origin.top + origin.height / 2);
      var scale = Math.max(0.08, Math.min(0.18, target.width / Math.max(origin.width, 1)));
      var finished = false;
      function complete() {
        if (finished) return;
        finished = true;
        shell.remove();
        active.delete(shell);
        if (snapshot.card.isConnected) snapshot.card.style.removeProperty('visibility');
        pulse(tab);
        window.PB1594LabFlightDiagnostic = 'finished:' + stage;
      }
      if (typeof shell.animate !== 'function') {
        complete();
        return;
      }
      var duration = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 260 : 880;
      var motion = shell.animate([
        { offset: 0, transform: 'translate3d(0px,0px,0) scale(1)', opacity: 1 },
        { offset: .18, transform: 'translate3d(' + dx * .08 + 'px,' + (dy * .05 - 13) + 'px,0) scale(.96)', opacity: 1 },
        { offset: .63, transform: 'translate3d(' + dx * .67 + 'px,' + (dy * .55 - 19) + 'px,0) scale(.54)', opacity: .88 },
        { offset: 1, transform: 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + scale + ')', opacity: 0 }
      ], { duration: duration, easing: 'cubic-bezier(.22,.78,.22,1)', fill: 'forwards' });
      motion.addEventListener('finish', complete, { once: true });
      motion.addEventListener('cancel', complete, { once: true });
      setTimeout(complete, duration + 500); // fail-safe for WebView/Windows 7
      window.PB1594LabFlightDiagnostic = 'flying:' + stage;
    } catch (error) {
      if (shell) { shell.remove(); active.delete(shell); }
      if (snapshot.card.isConnected) snapshot.card.style.removeProperty('visibility');
      window.PB1594LabFlightDiagnostic = 'error:' + (error && error.message);
    }
  }

  window.addEventListener('photobridge-lab-card-flight', onConfirmed);
  window.addEventListener('popstate', function () { last = null; });
  window.addEventListener('photobridge-auth-session-changed', function () {
    last = null;
    active.forEach(function (shell) { shell.remove(); });
    active.clear();
  });
})();