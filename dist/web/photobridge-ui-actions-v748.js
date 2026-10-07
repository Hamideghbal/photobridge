/* PhotoBridge v748 — direct mobile print/album actions on the preserved production bundle. */
(function () {
  'use strict';
  let pending = null;
  let modal = null;
  let allowAlbumSubmit = false;
  let selectedAlbumFiles = null;

  function closeModal() {
    if (modal) modal.remove();
    modal = null;
    document.removeEventListener('keydown', onEscape);
  }
  function onEscape(event) { if (event.key === 'Escape') closeModal(); }
  function dialog(title, text) {
    closeModal();
    const shade = document.createElement('div');
    shade.className = 'pb748ModalShade';
    const box = document.createElement('section');
    box.className = 'pb748Modal';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', title);
    const head = document.createElement('header');
    const heading = document.createElement('h2');
    heading.textContent = title;
    const x = document.createElement('button');
    x.type = 'button'; x.className = 'pb748Close'; x.setAttribute('aria-label', 'بستن');
    x.textContent = '×'; x.addEventListener('click', closeModal);
    head.append(heading, x); box.append(head);
    if (text) { const p = document.createElement('p'); p.textContent = text; box.append(p); }
    shade.append(box); shade.addEventListener('mousedown', event => {
      if (event.target === shade) closeModal();
    });
    document.body.append(shade); modal = shade;
    document.addEventListener('keydown', onEscape);
    x.focus();
    return box;
  }
  function actions(box) {
    const row = document.createElement('div'); row.className = 'pb748ModalActions';
    box.append(row); return row;
  }
  function button(label, fn, primary) {
    const b = document.createElement('button'); b.type = 'button';
    b.className = primary ? 'primary' : 'secondary'; b.textContent = label;
    b.addEventListener('click', fn); return b;
  }
  function visible(selector) {
    return Array.from(document.querySelectorAll(selector)).find(node => node.getClientRects().length) || null;
  }
  function waitFor(selector, fn, visibleOnly = true) {
    const pick = () => visibleOnly ? visible(selector) : document.querySelector(selector);
    const now = pick();
    if (now) { fn(now); return; }
    const observer = new MutationObserver(() => {
      const node = pick();
      if (node) { observer.disconnect(); clearTimeout(timeout); fn(node); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = setTimeout(() => observer.disconnect(), 6000);
  }
  function printChooser() { visible('.simplePrintPilotMobileInlineActions .simplePrintPilotPrimaryAdd')?.click(); }
  function missingPrintFiles() {
    const box = dialog('ارسال فایل برای چاپ', 'ابتدا سایز چاپ و عکس‌ها را انتخاب کن.');
    actions(box).append(button('انتخاب سایز و عکس', () => { closeModal(); printChooser(); }, true));
  }
  function startPrint(kind, navigate) {
    pending = kind === 'choose' ? 'print-choose' : 'print-send';
    navigate();
    waitFor('.simplePrintPilotMobileInlineActions .simplePrintPilotPrimaryAdd', () => {
      const action = pending; pending = null;
      if (action === 'print-choose') printChooser();
      if (action === 'print-send') {
        const send = visible('.simplePrintPilotMobileInlineActions .simplePrintPilotHeaderSubmit');
        if (send && !send.disabled) send.click();
        else missingPrintFiles();
      }
    });
  }
  function albumInput() {
    return document.querySelector('.albumOrderGrid input[type="file"][multiple]');
  }
  function chooseAlbumFromComposer() {
    closeModal();
    const add = visible('.albumOrderGrid .albumFileActionFile');
    if (add) add.click(); else albumInput()?.click();
  }
  function offerAlbumFileChoice() {
    const box = dialog('انتخاب فایل آلبوم', 'صفحهٔ سفارش آماده است. فایل‌های آلبوم را از اینجا انتخاب کن.');
    actions(box).append(button('انتخاب فایل آلبوم', chooseAlbumFromComposer, true));
  }
  function applyAlbumFiles() {
    const input = albumInput();
    const files = selectedAlbumFiles;
    if (!input || !files || !files.length) return;
    selectedAlbumFiles = null;
    try {
      const transfer = new DataTransfer();
      files.forEach(file => transfer.items.add(file));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (_) { offerAlbumFileChoice(); }
  }
  function albumSubmitButton() {
    return document.querySelector('.albumOrderWorkspace .albumQuoteCard button.primary');
  }
  function confirmAlbumSend() {
    const original = albumSubmitButton();
    const quote = document.querySelector('.albumOrderWorkspace .albumQuoteCard');
    if (!original || !quote) return;
    const hasFiles = !!document.querySelector('.albumOrderWorkspace .albumFileToolbar.hasFiles');
    const box = dialog('ریز قیمت و تأیید ارسال آلبوم', hasFiles
      ? 'ریز قیمت سفارش را بررسی کن و ارسال را تأیید کن.'
      : 'برای ارسال آلبوم، ابتدا فایل‌های آن را انتخاب کن.');
    const summary = quote.cloneNode(true);
    summary.classList.add('pb748QuoteSnapshot');
    summary.querySelectorAll('button, input, select, label').forEach(node => node.remove());
    box.append(summary);
    const row = actions(box);
    row.append(button('انتخاب فایل آلبوم', chooseAlbumFromComposer));
    row.append(button('بازگشت', closeModal));
    const confirm = button('تأیید و ارسال آلبوم برای چاپ', () => {
      closeModal(); allowAlbumSubmit = true; original.click(); allowAlbumSubmit = false;
    }, true);
    confirm.disabled = !hasFiles || original.disabled;
    row.append(confirm);
  }
  function startAlbum(kind, navigate) {
    if (kind === 'choose') {
      const chooser = document.createElement('input');
      chooser.type = 'file'; chooser.multiple = true;
      chooser.accept = 'image/*,.psd,.tif,.tiff';
      chooser.addEventListener('change', () => {
        const files = Array.from(chooser.files || []);
        chooser.remove();
        if (!files.length) return;
        selectedAlbumFiles = files;
        navigate();
        waitFor('.albumOrderGrid .albumFileToolbar', applyAlbumFiles);
      }, { once: true });
      document.body.append(chooser); chooser.click();
      return;
    }
    navigate();
    waitFor('.albumOrderWorkspace .albumQuoteCard', () => {
      setTimeout(confirmAlbumSend, 250);
    }, false);
  }
  window.PB748OrderAction = function (mode, action, navigate) {
    if (typeof navigate !== 'function') return;
    if (action === 'open' || (action === 'choose' && window.PB765OpenComposerOnly)) {
      window.PB765OpenComposerOnly = false;
      navigate();
      return;
    }
    if (mode === 'album') startAlbum(action, navigate);
    else startPrint(action, navigate);
  };
  // The album composer also gets the same confirmation when its own send control is used.
  document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const realSend = target.closest('.albumOrderWorkspace .albumQuoteCard button.primary');
    if (!realSend) return;
    if (allowAlbumSubmit) return;
    event.preventDefault(); event.stopImmediatePropagation();
    confirmAlbumSend();
  }, true);
})();
