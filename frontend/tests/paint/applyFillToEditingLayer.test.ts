import assert from 'node:assert/strict';
import test from 'node:test';
import { applyFillToEditingLayer } from '../../src/lib/paint/applyFillToEditingLayer.ts';
import type { Rgba } from '../../src/lib/paint/floodFill.ts';

const PURPLE: Rgba = { r: 139, g: 92, b: 246, a: 255 };
const RED: Rgba = { r: 255, g: 0, b: 0, a: 255 };

const getPixel = (data: Uint8ClampedArray, pixelIndex: number) => {
  const offset = pixelIndex * 4;
  return [...data.slice(offset, offset + 4)];
};

test('塗り領域を選択色の不透明画素として編集レイヤーへ反映する', () => {
  const data = new Uint8ClampedArray(3 * 4);
  const filledMask = new Uint8Array([0, 1, 0]);

  const antialiasedPixels = applyFillToEditingLayer(data, 3, 1, filledMask, PURPLE);

  assert.equal(antialiasedPixels, 0);
  assert.deepEqual(getPixel(data, 0), [0, 0, 0, 0]);
  assert.deepEqual(getPixel(data, 1), [139, 92, 246, 255]);
  assert.deepEqual(getPixel(data, 2), [0, 0, 0, 0]);
});

test('同色の塗りを半透明のペン縁の背後へ合成して白い隙間を残さない', () => {
  const data = new Uint8ClampedArray([
    0, 0, 0, 0, 139, 92, 246, 64, 139, 92, 246, 255, 139, 92, 246, 64, 0, 0, 0, 0,
  ]);
  const filledMask = new Uint8Array([1, 0, 0, 0, 0]);

  const antialiasedPixels = applyFillToEditingLayer(data, 5, 1, filledMask, PURPLE, 2);

  assert.equal(antialiasedPixels, 1);
  assert.deepEqual(getPixel(data, 0), [139, 92, 246, 255]);
  assert.deepEqual(getPixel(data, 1), [139, 92, 246, 255]);
  assert.deepEqual(getPixel(data, 2), [139, 92, 246, 255]);
  assert.deepEqual(getPixel(data, 3), [139, 92, 246, 64]);
  assert.deepEqual(getPixel(data, 4), [0, 0, 0, 0]);
});

test('異なる塗り色を半透明の線の背後へ正しく合成する', () => {
  const data = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 128]);
  const filledMask = new Uint8Array([1, 0]);

  const antialiasedPixels = applyFillToEditingLayer(data, 2, 1, filledMask, RED, 1);

  assert.equal(antialiasedPixels, 1);
  assert.deepEqual(getPixel(data, 1), [127, 0, 0, 255]);
});

test('完全不透明な線と塗り領域から離れた半透明画素は変更しない', () => {
  const data = new Uint8ClampedArray([0, 0, 0, 0, 20, 30, 40, 255, 0, 0, 0, 0, 139, 92, 246, 64]);
  const originalOpaque = getPixel(data, 1);
  const originalDistantEdge = getPixel(data, 3);
  const filledMask = new Uint8Array([1, 0, 0, 0]);

  const antialiasedPixels = applyFillToEditingLayer(data, 4, 1, filledMask, PURPLE, 1);

  assert.equal(antialiasedPixels, 0);
  assert.deepEqual(getPixel(data, 1), originalOpaque);
  assert.deepEqual(getPixel(data, 3), originalDistantEdge);
});

test('補正半径が0の場合は半透明の縁を補正しない', () => {
  const data = new Uint8ClampedArray([0, 0, 0, 0, 139, 92, 246, 64]);
  const filledMask = new Uint8Array([1, 0]);

  const antialiasedPixels = applyFillToEditingLayer(data, 2, 1, filledMask, PURPLE, 0);

  assert.equal(antialiasedPixels, 0);
  assert.deepEqual(getPixel(data, 1), [139, 92, 246, 64]);
});

test('不正な寸法とマスクはデータを変更しない', () => {
  const data = new Uint8ClampedArray([10, 20, 30, 40]);
  const original = new Uint8ClampedArray(data);

  assert.equal(applyFillToEditingLayer(data, 2, 1, new Uint8Array(2), PURPLE), 0);
  assert.equal(applyFillToEditingLayer(data, 1, 1, new Uint8Array(0), PURPLE), 0);
  assert.equal(applyFillToEditingLayer(data, 1, 1, new Uint8Array(1), PURPLE, -1), 0);
  assert.deepEqual(data, original);
});
