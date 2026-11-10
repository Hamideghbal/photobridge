// Standalone CRM SMS personalization helpers; NO SMS transmission or billing.
export const SMS_TOKENS = Object.freeze({
  customerName: '{نام_مشتری}',
  occasion: '{مناسبت}',
  studioName: '{نام_مجموعه}',
});
const KNOWN = new Set(Object.values(SMS_TOKENS).map(x=>x.slice(1,-1)));

export function insertTemplateToken(source, token, selectionStart, selectionEnd = selectionStart) {
  if (!Object.values(SMS_TOKENS).includes(token)) throw new Error('Unsupported SMS placeholder');
  const text = String(source ?? '');
  const start = Math.max(0, Math.min(text.length, Math.trunc(Number(selectionStart) || 0)));
  const end = Math.max(start, Math.min(text.length, Math.trunc(Number(selectionEnd) || start)));
  const newText = text.slice(0, start) + token + text.slice(end);
  const cursor = start + token.length;
  return { text: newText, selectionStart: cursor, selectionEnd: cursor };
}

export function renderSmsTemplate(template, data = {}) {
  const raw = String(template ?? '');
  const errors = [];
  const values = {
    'نام_مشتری': String(data.customerName ?? '').trim(),
    'مناسبت': String(data.occasion ?? '').trim(),
    'نام_مجموعه': String(data.studioName ?? '').trim(),
  };
  const unexpected = new Set();
  const rendered = raw.replace(/\{([^{}]+)\}/gu, (whole, field) => {
    if (!KNOWN.has(field)) {
      unexpected.add(field);
      return whole;
    }
    if (!values[field]) {
      errors.push(`مقدار «${field}» برای این گیرنده ثبت نشده است`);
      return whole;
    }
    return values[field];
  });
  for (const field of unexpected) errors.push(`متغیر ناشناخته: ${field}`);
  if (!raw.trim()) errors.push('متن پیامک خالی است');
  // Even an extra malformed brace cannot silently pass into an SMS preview.
  if (/[{}]/u.test(rendered)) errors.push('متغیر جایگزین‌نشده یا کروشهٔ نامعتبر در متن وجود دارد');
  return { text: rendered, valid: errors.length === 0, errors };
}

export function previewSmsForCustomers(template, customers, occasion, studioName) {
  if (!Array.isArray(customers)) throw new TypeError('customers must be an array');
  return customers.map(customer => ({
    customerId: customer.id,
    ...renderSmsTemplate(template, {
      customerName: customer.fullName,
      occasion: customer.occasion ?? occasion,
      studioName,
    }),
  }));
}
