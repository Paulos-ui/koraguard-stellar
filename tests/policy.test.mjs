import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSafety, canPlanPayment, normalizeAmount} from '../lib/policy.ts';

test('reserves commitments before proposing spendable funds', () => {
  const result = assessSafety(100, [{amount:30},{amount:20}], 2);
  assert.equal(result.reserved, 50);
  assert.equal(result.safeToPay, 48);
  assert.equal(result.status, 'covered');
  assert.equal(canPlanPayment(48.0000001, result), false);
  assert.equal(canPlanPayment(48, result), true);
});
test('flags uncovered commitments without negative payment allowance', () => {
  const result = assessSafety(10, [{amount:12}], 2);
  assert.equal(result.safeToPay, 0);
  assert.equal(result.status, 'at-risk');
});
test('rejects malformed or excessive precision amounts', () => {
  assert.equal(normalizeAmount('2.12345678'), null);
  assert.equal(normalizeAmount('-1'), null);
  assert.equal(normalizeAmount('2.1234567'), 2.1234567);
  assert.equal(normalizeAmount('0'), null);
});
test('rejects invalid commitments', () => {
  assert.throws(() => assessSafety(20, [{amount:-5}], 2));
});
test('marks a narrow budget as tight', () => {
  const assessment = assessSafety(11, [{amount:8.5}], 2);
  assert.equal(assessment.safeToPay, 0.5);
  assert.equal(assessment.status, 'tight');
});
test('does not allow negative or zero transfers', () => {
  const assessment = assessSafety(20, [], 2);
  assert.equal(canPlanPayment(-2, assessment), false);
  assert.equal(canPlanPayment(0, assessment), false);
  assert.equal(canPlanPayment(NaN, assessment), false);
});
