import assert from 'node:assert/strict';
import test from 'node:test';
import { createChangedPixelMask } from '../../src/lib/paint/createChangedPixelMask.ts';

test('変更された画素だけをマスクへ記録する', () => {
  const before = new Uint8ClampedArray([255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
  const after = new Uint8ClampedArray([255, 255, 255, 255, 239, 68, 68, 255, 0, 0, 0, 128]);

  assert.deepEqual(createChangedPixelMask(before, after), new Uint8Array([0, 1, 1]));
});

test('変更がない場合はすべて0のマスクを返す', () => {
  const data = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);

  assert.deepEqual(createChangedPixelMask(data, data), new Uint8Array([0, 0]));
});

test('配列長が異なる場合やRGBA単位でない場合は空のマスクを返す', () => {
  assert.deepEqual(
    createChangedPixelMask(new Uint8ClampedArray(4), new Uint8ClampedArray(8)),
    new Uint8Array(0),
  );
  assert.deepEqual(
    createChangedPixelMask(new Uint8ClampedArray(3), new Uint8ClampedArray(3)),
    new Uint8Array(0),
  );
});
