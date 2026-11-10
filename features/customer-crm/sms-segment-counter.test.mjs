import test from 'node:test';
import assert from 'node:assert/strict';
import {countSmsSegments, estimateSmsBatch} from './sms-segment-counter.mjs';

test('Persian SMS 70 Unicode units fits one part, 71 needs two', () => {
  assert.deepEqual(
    [countSmsSegments('س'.repeat(70)).segments, countSmsSegments('س'.repeat(71)).segments],
    [1, 2],
  );
  assert.equal(countSmsSegments('س'.repeat(134)).segments, 2);
  assert.equal(countSmsSegments('س'.repeat(135)).segments, 3);
});
test('GSM-7 single and multipart boundaries', () => {
  assert.equal(countSmsSegments('A'.repeat(160)).segments, 1);
  assert.equal(countSmsSegments('A'.repeat(161)).segments, 2);
  assert.equal(countSmsSegments('A'.repeat(306)).segments, 2);
  assert.equal(countSmsSegments('A'.repeat(307)).segments, 3);
});
test('GSM extension characters count as 2 septets', () => {
  assert.equal(countSmsSegments('^'.repeat(80)).segments, 1);
  assert.equal(countSmsSegments('^'.repeat(81)).segments, 2);
  assert.equal(countSmsSegments('€'.repeat(80)).units, 160);
});
test('Unicode emoji take two UTF-16 code units each', () => {
  assert.equal(countSmsSegments('🎂'.repeat(35)).segments, 1);
  assert.equal(countSmsSegments('🎂'.repeat(36)).segments, 2);
});
test('mixed Persian and Latin is Unicode; empty message needs zero parts', () => {
  assert.equal(countSmsSegments('Hello سلام').encoding, 'UCS-2');
  assert.equal(countSmsSegments('').segments, 0);
});
test('batch estimate sums personalized recipient texts, not template length', () => {
  const previews = [
    {customerId: 'a', valid: true, text: 'س'.repeat(70)},
    {customerId: 'b', valid: true, text: 'س'.repeat(71)},
    {customerId: 'c', valid: false, text: 'س'.repeat(200)},
  ];
  const result = estimateSmsBatch(previews, 180);
  assert.equal(result.recipients, 3);
  assert.equal(result.validRecipients, 2);
  assert.equal(result.invalidRecipients, 1);
  assert.equal(result.totalSegments, 3);
  assert.equal(result.estimatedCostRials, 540);
  assert.deepEqual(result.details.map(x => x.segments), [1,2,3]);
});
test('missing/invalid provider tariff never creates invented prices', () => {
  assert.equal(estimateSmsBatch([{valid: true, text:'سلام'}]).estimatedCostRials, null);
  assert.equal(estimateSmsBatch([{valid: true, text:'سلام'}], 'abc').estimatedCostRials, null);
  assert.equal(estimateSmsBatch([{valid: true, text:'سلام'}], -1).estimatedCostRials, null);
});
