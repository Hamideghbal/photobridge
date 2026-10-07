(() => {
  'use strict';
  const MARK = 'pb781';
  let scheduled = false;
  let applying = false;

  const norm = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const compactSize = (row) => {
    const spec = row.querySelector('.fileSpec b, .labEditablePrintSpec b');
    return norm(spec && spec.textContent) || 'سایز نامشخص';
  };
  const cardSize = (card) => {
    const chip = card.querySelector('.labEditablePrintChip, .minimalMetaChips .metaChip.actionChip');
    return norm(chip && chip.textContent) || 'سایز نامشخص';
  };

  function installGrouping(card) {
    if (!card || card.dataset.pb781Grouped === '1' && card.querySelector('.labSizeGroupHeader:not([data-pb781-size-header])')) return;
    if (card.querySelector('.labSizeGroupHeader:not([data-pb781-size-header])') || card.querySelector('.labPrintSizeSummary:not([data-pb781-size-summary])')) return;

    card.querySelectorAll('[data-pb781-size-header], [data-pb781-size-summary]').forEach(el => el.remove());

    const list = card.querySelector('.labFileList');
    const grid = card.querySelector('.labFileCardGrid');
    const items = list
      ? Array.from(list.querySelectorAll(':scope > .labFileRow'))
      : grid
        ? Array.from(grid.querySelectorAll(':scope > .labMirrorFileCard'))
        : [];
    if (!items.length) return;

    // Album orders are intentionally not grouped by print size.
    const title = norm(card.querySelector('.labFilesDetailHead')?.textContent);
    if (title.includes('فایل‌های آلبوم')) return;

    const getSize = list ? compactSize : cardSize;
    const groups = new Map();
    items.forEach((item) => {
      const size = getSize(item);
      groups.set(size, (groups.get(size) || 0) + 1);
    });

    const head = card.querySelector('.labFilesDetailHead');
    if (head && groups.size) {
      const summary = document.createElement('div');
      summary.className = 'labPrintSizeSummary';
      summary.dataset.pb781SizeSummary = '1';
      summary.setAttribute('dir', 'rtl');
      for (const [label, count] of groups) {
        const chip = document.createElement('span');
        const b = document.createElement('b');
        const small = document.createElement('small');
        b.textContent = label;
        small.textContent = `${count.toLocaleString('fa-IR')} عکس`;
        chip.append(b, small);
        summary.appendChild(chip);
      }
      head.insertAdjacentElement('afterend', summary);
    }

    let previous = null;
    items.forEach((item) => {
      const size = getSize(item);
      if (size !== previous) {
        const header = document.createElement('div');
        header.className = `labSizeGroupHeader${grid ? ' cardGridGroupHeader' : ''}`;
        header.dataset.pb781SizeHeader = '1';
        header.setAttribute('dir', 'rtl');
        const b = document.createElement('b');
        const span = document.createElement('span');
        b.textContent = size;
        span.textContent = `${(groups.get(size) || 0).toLocaleString('fa-IR')} عکس`;
        header.append(b, span);
        item.insertAdjacentElement('beforebegin', header);
        previous = size;
      }
    });
    card.dataset.pb781Grouped = '1';
  }

  function apply() {
    scheduled = false;
    if (applying) return;
    applying = true;
    try {
      document.querySelectorAll('.orderFilesCard').forEach(installGrouping);
    } finally {
      applying = false;
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(apply);
  }

  const observer = new MutationObserver(schedule);
  const start = () => {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
    schedule();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);
})();