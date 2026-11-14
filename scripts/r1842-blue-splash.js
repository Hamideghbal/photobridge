(function () {
  'use strict';
  // Keep the same entry policy as R1836: installed mobile PWA only.
  if (!document.documentElement.classList.contains('pb1842SplashActive')) return;
  if (window.__pbSplashInit) return;
  window.__pbSplashInit = true;

  var splash  = document.getElementById('pb-splash');
  var fill    = document.getElementById('pb1842-fill');
  var track   = document.getElementById('pb1842-track');
  var pct     = document.getElementById('pb-pct');
  var status  = document.getElementById('pb-status');
  var root    = document.getElementById('root');
  var MIN = 2200, FALLBACK = 9000;
  var themeMeta=document.querySelector('meta[name="theme-color"]');
  var priorTheme=themeMeta?themeMeta.getAttribute('content'):null;
  if(themeMeta)themeMeta.setAttribute('content','#071f47');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = { target: 8, shown: 0, ready: false, done: false, raf: 0, timers: [], t0: 0 };

  function later(fn, ms) { var id = setTimeout(fn, ms); S.timers.push(id); return id; }
  function clearTimers() { S.timers.forEach(clearTimeout); S.timers = []; }
  function fa(n) { return Math.round(n).toLocaleString('fa-IR') + '٪'; }
  function setStage(v, msg) { S.target = v; if (msg) status.textContent = msg; }

  /* R1842: obsolete HTML was removed at build time, not by sweeping
     runtime DOM: generic #loading or .splash might belong to live panels. */
  /* ── بوکه‌های شناور (اتمسفر عکاسی) ── */
  if (!reduced) {
    var bokeh = document.getElementById('pb1842-bokeh');
    for (var i = 0; i < 16; i++) {
      var s = document.createElement('span');
      var size = 6 + Math.random() * 22;
      s.style.width = s.style.height = size.toFixed(1) + 'px';
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.setProperty('--o', (0.1 + Math.random() * 0.22).toFixed(2));
      s.style.setProperty('--sway', ((Math.random() - 0.5) * 90).toFixed(0) + 'px');
      s.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 14).toFixed(1) + 's';
      bokeh.appendChild(s);
    }
  }

  /* ── حلقهٔ پیشرفت ── */
  function tick() {
    S.shown += (S.target - S.shown) * 0.085;
    if (S.target === 100 && S.shown > 99.4) S.shown = 100;
    fill.style.width = S.shown + '%';
    pct.textContent = fa(S.shown);
    track.setAttribute('aria-valuenow', Math.round(S.shown));
    if (!splash.hidden) S.raf = requestAnimationFrame(tick);
  }

  /* ── تشخیص آماده‌شدن برنامه ── */
  function checkRoot() {
    if (splash.hidden || S.ready) return;
    // Wait for the role handoff and skip React's temporary loading placeholder.
    var h=document.documentElement;
    if(window.__PB1836RoleHandoff ||
       h.classList.contains('pb1493SessionResumePending') ||
       h.classList.contains('pb1721MobileEntryPending'))return;
    if(!root || !root.childElementCount)return;
    var child=root.firstElementChild;
    if(root.childElementCount===1 && child &&
       child.classList.contains('center') &&
       /^در حال بارگذاری/.test((child.textContent||'').trim()))return;
    if(root.offsetHeight>40)ready();
  }
  var mo = new MutationObserver(checkRoot);
  if (root) mo.observe(root, { childList: true, subtree: true });
  window.addEventListener('load', checkRoot);
  window.addEventListener('photobridge:ready', function () { ready(); });

  function ready() {
    if (S.ready || splash.hidden) return;
    S.ready = true;
    setStage(100, 'آماده است');
    var wait = Math.max(0, MIN - (performance.now() - S.t0));
    later(exit, wait + 380);
  }

  function exit() {
    S.done = true;
    splash.classList.add('pb1842-done');            /* بستن شاتر + فلش */
    later(function () {
      splash.classList.add('pb1842-hide');          /* محو شدن */
      later(hide, 650);
    }, reduced ? 60 : 430);
  }

  function hide() {
    cancelAnimationFrame(S.raf);
    mo.disconnect();
    splash.hidden = true;
    splash.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('pb1842SplashActive');
    if(themeMeta && priorTheme)themeMeta.setAttribute('content',priorTheme);
  }

  function start() {
    clearTimers();
    cancelAnimationFrame(S.raf);
    S.target = 8; S.shown = 0; S.ready = false; S.done = false; S.t0 = performance.now();
    splash.classList.remove('pb1842-done', 'pb1842-hide');
    splash.hidden = false;
    splash.removeAttribute('aria-hidden');
    document.documentElement.classList.add('pb1842SplashActive');
    fill.style.width = '0%'; pct.textContent = fa(0);
    status.textContent = 'در حال آماده‌سازی محیط…';
    /* اجرای مجدد انیمیشن‌های ورودی */
    splash.style.display = 'none'; void splash.offsetWidth; splash.style.display = '';
    S.raf = requestAnimationFrame(tick);
    later(function () { setStage(38, 'اتصال به سرویس‌ها…'); }, 700);
    later(function () { setStage(66, 'بارگذاری اطلاعات…'); }, 1500);
    later(function () { setStage(88, 'آماده‌سازی نهایی…'); }, 2300);

    later(function () { if (!S.ready) ready(); }, FALLBACK);  /* هرگز قفل نشود */
    checkRoot();
  }

  /* API عمومی برای اعلام آمادگی از داخل React */
  window.PhotoBridgeSplash = {
    done: ready,
    restart: function () { start(); }
  };

  start();
})();
