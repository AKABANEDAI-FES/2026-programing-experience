import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prepareSubmissionAttempt,
  shouldRecoverIdempotencyKey,
} from '../src/lib/release-submission.ts';

test('同じ本文の再送では同じキーを再利用する', () => {
  const original = { key: 'first-key', body: '{"commands":[]}' };
  const retry = prepareSubmissionAttempt(original.body, original, () => 'unexpected-key');

  assert.equal(retry, original);
});

test('本文を編集した再送では新しいキーを生成する', () => {
  const original = { key: 'first-key', body: '{"commands":[]}' };
  const edited = prepareSubmissionAttempt(
    '{"commands":[{"type":"move"}]}',
    original,
    () => 'second-key',
  );

  assert.deepEqual(edited, {
    key: 'second-key',
    body: '{"commands":[{"type":"move"}]}',
  });
});

test('キー再利用エラーだけを1回に限り自動回復する', () => {
  assert.equal(
    shouldRecoverIdempotencyKey(
      { success: false, code: 'IDEMPOTENCY_KEY_REUSED', message: 'conflict' },
      0,
    ),
    true,
  );
  assert.equal(
    shouldRecoverIdempotencyKey(
      { success: false, code: 'IDEMPOTENCY_KEY_REUSED', message: 'conflict' },
      1,
    ),
    false,
  );
  assert.equal(
    shouldRecoverIdempotencyKey(
      { success: false, code: 'REQUEST_IN_PROGRESS', message: 'pending' },
      0,
    ),
    false,
  );
});
