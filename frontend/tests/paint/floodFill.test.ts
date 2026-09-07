import assert from 'node:assert/strict';
import test from 'node:test';
import { floodFill, type Rgba } from '../../src/lib/paint/floodFill.ts';

const WHITE = [255, 255, 255, 255] as const;
const BLACK = [0, 0, 0, 255] as const;
const GREEN: Rgba = { r: 34, g: 197, b: 94, a: 255 };

const createRaster = (
  width: number,
  height: number,
  color: readonly [number, number, number, number] = WHITE,
): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let offset = 0; offset < data.length; offset += 4) {
    data.set(color, offset);
  }

  return data;
};

const setPixel = (
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
) => {
  data.set(color, (y * width + x) * 4);
};

const getPixel = (data: Uint8ClampedArray, width: number, x: number, y: number) => {
  const offset = (y * width + x) * 4;
  return [...data.slice(offset, offset + 4)];
};

const drawRectangleBorder = (
  data: Uint8ClampedArray,
  width: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
  gap?: { x: number; y: number },
) => {
  for (let x = left; x <= right; x += 1) {
    if (gap?.x !== x || gap.y !== top) {
      setPixel(data, width, x, top, BLACK);
    }
    if (gap?.x !== x || gap.y !== bottom) {
      setPixel(data, width, x, bottom, BLACK);
    }
  }

  for (let y = top; y <= bottom; y += 1) {
    if (gap?.x !== left || gap.y !== y) {
      setPixel(data, width, left, y, BLACK);
    }
    if (gap?.x !== right || gap.y !== y) {
      setPixel(data, width, right, y, BLACK);
    }
  }
};

test('閉じた領域だけを4近傍で塗り潰す', () => {
  const width = 7;
  const height = 7;
  const data = createRaster(width, height);
  drawRectangleBorder(data, width, 1, 1, 5, 5);

  const result = floodFill(data, width, height, 3, 3, GREEN);

  assert.deepEqual(result, { filledPixels: 9, aborted: false, touchesEdge: false });
  assert.deepEqual(getPixel(data, width, 3, 3), [34, 197, 94, 255]);
  assert.deepEqual(getPixel(data, width, 0, 0), [...WHITE]);
  assert.deepEqual(getPixel(data, width, 1, 1), [...BLACK]);
});

test('背景領域はCanvas端へ到達したと判定する', () => {
  const data = createRaster(5, 5);

  const result = floodFill(data, 5, 5, 2, 2, GREEN);

  assert.deepEqual(result, { filledPixels: 25, aborted: false, touchesEdge: true });
});

test('線に隙間がある領域は背景へ漏れてCanvas端へ到達する', () => {
  const width = 7;
  const height = 7;
  const data = createRaster(width, height);
  drawRectangleBorder(data, width, 1, 1, 5, 5, { x: 3, y: 1 });

  const result = floodFill(data, width, height, 3, 3, GREEN);

  assert.equal(result.aborted, false);
  assert.equal(result.touchesEdge, true);
});

test('斜めに接する同色画素は同じ領域として扱わない', () => {
  const width = 5;
  const height = 5;
  const data = createRaster(width, height, BLACK);
  setPixel(data, width, 2, 2, WHITE);
  setPixel(data, width, 3, 3, WHITE);

  const result = floodFill(data, width, height, 2, 2, GREEN);

  assert.deepEqual(result, { filledPixels: 1, aborted: false, touchesEdge: false });
  assert.deepEqual(getPixel(data, width, 3, 3), [...WHITE]);
});

test('許容差以内の色だけを同じ領域として扱う', () => {
  const width = 5;
  const height = 5;
  const data = createRaster(width, height, BLACK);
  setPixel(data, width, 2, 2, WHITE);
  setPixel(data, width, 3, 2, [250, 250, 250, 255]);
  setPixel(data, width, 1, 2, [240, 240, 240, 255]);

  const result = floodFill(data, width, height, 2, 2, GREEN);

  assert.equal(result.filledPixels, 2);
  assert.deepEqual(getPixel(data, width, 3, 2), [34, 197, 94, 255]);
  assert.deepEqual(getPixel(data, width, 1, 2), [240, 240, 240, 255]);
});

test('置換先が目標色と十分近い場合は何もしない', () => {
  const data = createRaster(2, 2, [34, 197, 94, 255]);

  const result = floodFill(data, 2, 2, 0, 0, GREEN);

  assert.deepEqual(result, { filledPixels: 0, aborted: false, touchesEdge: false });
});

test('最大画素数へ到達した場合は処理を中断する', () => {
  const data = createRaster(5, 5);

  const result = floodFill(data, 5, 5, 2, 2, GREEN, { maxPixels: 4 });

  assert.deepEqual(result, { filledPixels: 4, aborted: true, touchesEdge: true });
});

test('不正な寸法と座標はデータを変更せずno-opにする', () => {
  const data = createRaster(2, 2);
  const original = new Uint8ClampedArray(data);

  assert.deepEqual(floodFill(data, 3, 2, 0, 0, GREEN), {
    filledPixels: 0,
    aborted: false,
    touchesEdge: false,
  });
  assert.deepEqual(floodFill(data, 2, 2, -1, 0, GREEN), {
    filledPixels: 0,
    aborted: false,
    touchesEdge: false,
  });
  assert.deepEqual(data, original);
});
