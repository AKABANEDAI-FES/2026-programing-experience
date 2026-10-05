import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_SAY_TEXT_LENGTH } from 'shared/release';
import { validateReleaseRequest } from '../src/validation.ts';

const createRequestWithSayText = (text: string) => ({
  image_base64: 'data:image/png;base64,AAAA',
  commands: [{ type: 'say', text }],
});

test('セリフは最大文字数ちょうどまで受け付ける', () => {
  const result = validateReleaseRequest(createRequestWithSayText('あ'.repeat(MAX_SAY_TEXT_LENGTH)));

  assert.equal(result.success, true);
});

test('セリフが最大文字数を超える場合はエラーにする', () => {
  const result = validateReleaseRequest(
    createRequestWithSayText('あ'.repeat(MAX_SAY_TEXT_LENGTH + 1)),
  );

  assert.deepEqual(result, {
    success: false,
    message: `commands[0].text は${MAX_SAY_TEXT_LENGTH}文字以下で指定してください`,
  });
});
