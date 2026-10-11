/* R1113 — scope polished native-alert replacement to lab print-tariff saves only. */
(() => {
  'use strict';
  if (window.__pb1113PriceNotice) return;
  window.__pb1113PriceNotice = true;
  const originalAlert = window.alert.bind(window);
  const eligible = [
    /^تعرفه و موجودی ذخیره شد$/,
    /^ذخیره تعرفه و موجودی انجام نشد/,
    /^یکی از سایزهای تعرفه دیگر معتبر نیست/,
    /^تعرفه مشتری آزاد ذخیره شد$/,
    /^ذخیره تعرفه مشتری آزاد انجام نشد/,
    /^ذخیره سایز و تعرفه انجام نشد/,
    /^سایز ذخیره شد اما ثبت تعرفه آن کامل نشد/,
    /^نام سایز را وارد کن/,
    /^عرض و ارتفاع معتبر وارد کن/
  ];
  function isPriceScreen() {
    return /^\/lab\/settings\/prices(?:\/|$)/.test(location.pathname) ||
      !!document.querySelector('.labPrintPricingCard');
  }
  function showNotice(message) {
    const previousFocus = document.activeElement;
    document.querySelector('.pb1113PriceNoticeBack')?.remove();
    const success = /ذخیره شد/.test(message) && !/نشد|اما|کامل نشد/.test(message);
    const back = document.createElement('div');
    back.className = 'pb1113PriceNoticeBack';
    back.innerHTML = '<div class="pb1113PriceNotice" role="alertdialog" aria-modal="true" aria-labelledby="pb1113NoticeTitle" aria-describedby="pb1113NoticeText"><div class="pb1113PriceNoticeIcon" aria-hidden="true"></div><h2 id="pb1113NoticeTitle"></h2><p id="pb1113NoticeText"></p><button type="button">متوجه شدم</button></div>';
    const dialog = back.firstElementChild;
    dialog.dataset.tone = success ? 'success' : 'error';
    dialog.querySelector('.pb1113PriceNoticeIcon').textContent = success ? '✓' : '!';
    dialog.querySelector('h2').textContent = success ? 'قیمت‌ها با موفقیت ذخیره شدند' : 'نیاز به بررسی';
    dialog.querySelector('p').textContent = message;
    const button = dialog.querySelector('button');
    const close = () => {
      back.removeEventListener('keydown', onKeydown);
      back.remove();
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus();
    };
    function onKeydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Tab') { event.preventDefault(); button.focus(); }
    }
    button.addEventListener('click', close);
    back.addEventListener('mousedown', event => { if (event.target === back) close(); });
    back.addEventListener('keydown', onKeydown);
    document.body.append(back);
    button.focus();
  }
  window.alert = function(message) {
    const text = String(message ?? '');
    if (!isPriceScreen() || !eligible.some(pattern => pattern.test(text))) {
      return originalAlert(message);
    }
    showNotice(text);
  };
})();