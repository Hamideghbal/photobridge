import test from 'node:test';
import assert from 'node:assert/strict';
import { SMS_TOKENS, insertTemplateToken, renderSmsTemplate, previewSmsForCustomers } from './sms-personalization.mjs';

test('inserts customer-name placeholder where the editor caret is', () => {
  const out = insertTemplateToken('سلام  عزیز', SMS_TOKENS.customerName, 5);
  assert.equal(out.text, 'سلام {نام_مشتری} عزیز');
  assert.equal(out.selectionStart, out.selectionEnd);
});
test('replaces selected editor text with customer placeholder', () => {
  const out = insertTemplateToken('سلام فلانی عزیز', SMS_TOKENS.customerName, 5, 10);
  assert.equal(out.text, 'سلام {نام_مشتری} عزیز');
});
test('personalizes every batch preview independently, including repeated tokens', () => {
  const out = previewSmsForCustomers('{نام_مشتری} عزیز، سلام {نام_مشتری}! {مناسبت} مبارک از {نام_مجموعه}.', [
    { id: 1, fullName: 'نگار احمدی' },
    { id: 2, fullName: 'علی رضایی' },
  ], 'تولد', 'آتلیه نمونه');
  assert.equal(out.length, 2);
  assert.ok(out.every(x => x.valid));
  assert.match(out[0].text, /نگار احمدی عزیز، سلام نگار احمدی/);
  assert.match(out[1].text, /علی رضایی عزیز، سلام علی رضایی/);
  assert.doesNotMatch(out[0].text, /علی رضایی/);
});
test('does not silently keep an unknown token or empty customer name', () => {
  assert.equal(renderSmsTemplate('سلام {نام_مشتری}', { customerName: '' }).valid, false);
  assert.equal(renderSmsTemplate('سلام {نام_نامعتبر}', { customerName: 'نگار' }).valid, false);
  assert.equal(renderSmsTemplate('', { customerName: 'نگار' }).valid, false);
});
test('does not silently output partially unmatched braces', () => {
  assert.equal(renderSmsTemplate('سلام {نام_مشتری', { customerName: 'نگار' }).valid, false);
});
test('rejects unknown tokens during insertion', () => {
  assert.throws(() => insertTemplateToken('سلام', '{شماره_حساب}', 2));
});
