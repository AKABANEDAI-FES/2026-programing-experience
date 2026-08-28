import type { Rgba } from './floodFill';

const DEFAULT_EDGE_RADIUS = 2;

const hasFilledNeighbor = (
  filledMask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  radius: number,
): boolean => {
  const left = Math.max(0, x - radius);
  const right = Math.min(width - 1, x + radius);
  const top = Math.max(0, y - radius);
  const bottom = Math.min(height - 1, y + radius);

  for (let neighborY = top; neighborY <= bottom; neighborY += 1) {
    for (let neighborX = left; neighborX <= right; neighborX += 1) {
      if (filledMask[neighborY * width + neighborX] !== 0) {
        return true;
      }
    }
  }

  return false;
};

/**
 * 塗り潰し領域を編集レイヤーへ反映する。
 * 領域に隣接した半透明のペン縁には塗り色を背面合成し、白い隙間を防ぐ。
 */
export function applyFillToEditingLayer(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  filledMask: Uint8Array,
  fill: Rgba,
  edgeRadius = DEFAULT_EDGE_RADIUS,
): number {
  const pixelCount = width * height;

  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    data.length !== pixelCount * 4 ||
    filledMask.length !== pixelCount ||
    !Number.isSafeInteger(edgeRadius) ||
    edgeRadius < 0
  ) {
    return 0;
  }

  const originalData = new Uint8ClampedArray(data);
  let antialiasedPixels = 0;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (filledMask[pixelIndex] === 0) {
      continue;
    }

    const offset = pixelIndex * 4;
    data[offset] = fill.r;
    data[offset + 1] = fill.g;
    data[offset + 2] = fill.b;
    data[offset + 3] = fill.a;
  }

  if (edgeRadius === 0) {
    return antialiasedPixels;
  }

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    if (filledMask[pixelIndex] !== 0) {
      continue;
    }

    const offset = pixelIndex * 4;
    const alphaByte = originalData[offset + 3];

    // 透明部分は通常の塗り領域、完全不透明部分は線の本体なので変更しない。
    if (alphaByte === 0 || alphaByte === 255) {
      continue;
    }

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    if (!hasFilledNeighbor(filledMask, width, height, x, y, edgeRadius)) {
      continue;
    }

    // destination-over で不透明な塗り色を既存の半透明線の背後へ置いた場合と同じ合成。
    const alpha = alphaByte / 255;
    data[offset] = Math.round(originalData[offset] * alpha + fill.r * (1 - alpha));
    data[offset + 1] = Math.round(originalData[offset + 1] * alpha + fill.g * (1 - alpha));
    data[offset + 2] = Math.round(originalData[offset + 2] * alpha + fill.b * (1 - alpha));
    data[offset + 3] = 255;
    antialiasedPixels += 1;
  }

  return antialiasedPixels;
}
