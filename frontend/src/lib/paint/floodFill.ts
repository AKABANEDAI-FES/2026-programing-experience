export type Rgba = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type FloodFillOptions = {
  /** RGB の色距離として扱う許容差。既定値はアンチエイリアス境界を越えにくい 12。 */
  tolerance?: number;
  /** 一回の操作で置換できる画素数の上限。 */
  maxPixels?: number;
};

export type FloodFillResult = {
  filledPixels: number;
  aborted: boolean;
};

const DEFAULT_TOLERANCE = 12;

const noOperation = (): FloodFillResult => ({ filledPixels: 0, aborted: false });

const isByte = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 255;

const isRgba = (color: Rgba): boolean =>
  isByte(color.r) && isByte(color.g) && isByte(color.b) && isByte(color.a);

/**
 * RGBA ラスターを4近傍で塗りつぶす、再帰を使わない scanline flood fill。
 * `data` は処理対象として直接書き換える。
 */
export function floodFill(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fill: Rgba,
  options: FloodFillOptions = {},
): FloodFillResult {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isSafeInteger(startX) ||
    !Number.isSafeInteger(startY) ||
    startX < 0 ||
    startX >= width ||
    startY < 0 ||
    startY >= height ||
    !isRgba(fill)
  ) {
    return noOperation();
  }

  const pixelCount = width * height;

  if (!Number.isSafeInteger(pixelCount) || data.length !== pixelCount * 4) {
    return noOperation();
  }

  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const maxPixels = options.maxPixels ?? pixelCount;

  if (
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    !Number.isSafeInteger(maxPixels) ||
    maxPixels <= 0
  ) {
    return noOperation();
  }

  const limit = Math.min(maxPixels, pixelCount);
  const toleranceSquared = tolerance * tolerance;
  const startOffset = (startY * width + startX) * 4;
  const target: Rgba = {
    r: data[startOffset],
    g: data[startOffset + 1],
    b: data[startOffset + 2],
    a: data[startOffset + 3],
  };

  const colorDistanceSquared =
    (target.r - fill.r) ** 2 + (target.g - fill.g) ** 2 + (target.b - fill.b) ** 2;

  if (target.a === fill.a && colorDistanceSquared <= toleranceSquared) {
    return noOperation();
  }

  const matchesTarget = (x: number, y: number): boolean => {
    const offset = (y * width + x) * 4;

    if (data[offset + 3] !== target.a) {
      return false;
    }

    const distanceSquared =
      (data[offset] - target.r) ** 2 +
      (data[offset + 1] - target.g) ** 2 +
      (data[offset + 2] - target.b) ** 2;

    return distanceSquared <= toleranceSquared;
  };

  const writeFill = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    data[offset] = fill.r;
    data[offset + 1] = fill.g;
    data[offset + 2] = fill.b;
    data[offset + 3] = fill.a;
  };

  // 1画素あたり一度だけキューへ入れる。二つの Int32Array は大きな領域でも再帰を避ける。
  const queued = new Uint8Array(pixelCount);
  const queuedX = new Int32Array(pixelCount);
  const queuedY = new Int32Array(pixelCount);
  let queueHead = 0;
  let queueTail = 0;
  let filledPixels = 0;

  const enqueue = (x: number, y: number) => {
    const index = y * width + x;

    if (queued[index] !== 0) {
      return;
    }

    queued[index] = 1;
    queuedX[queueTail] = x;
    queuedY[queueTail] = y;
    queueTail += 1;
  };

  const enqueueRunsAboveOrBelow = (left: number, right: number, y: number) => {
    if (y < 0 || y >= height) {
      return;
    }

    let x = left;

    while (x <= right) {
      if (!matchesTarget(x, y)) {
        x += 1;
        continue;
      }

      const runStart = x;

      while (x <= right && matchesTarget(x, y)) {
        x += 1;
      }

      let hasQueuedPixel = false;
      for (let runX = runStart; runX < x; runX += 1) {
        if (queued[y * width + runX] !== 0) {
          hasQueuedPixel = true;
          break;
        }
      }

      if (!hasQueuedPixel) {
        enqueue(runStart, y);
      }
    }
  };

  enqueue(startX, startY);

  while (queueHead < queueTail) {
    const seedX = queuedX[queueHead];
    const seedY = queuedY[queueHead];
    queueHead += 1;

    if (!matchesTarget(seedX, seedY)) {
      continue;
    }

    let left = seedX;
    let right = seedX;

    while (left > 0 && matchesTarget(left - 1, seedY)) {
      left -= 1;
    }

    while (right < width - 1 && matchesTarget(right + 1, seedY)) {
      right += 1;
    }

    for (let x = left; x <= right; x += 1) {
      if (filledPixels >= limit) {
        return { filledPixels, aborted: true };
      }

      writeFill(x, seedY);
      filledPixels += 1;
    }

    enqueueRunsAboveOrBelow(left, right, seedY - 1);
    enqueueRunsAboveOrBelow(left, right, seedY + 1);
  }

  return { filledPixels, aborted: false };
}
