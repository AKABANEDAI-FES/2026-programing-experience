/**
 * 変更前後のRGBAデータを比較し、値が変わった画素を1とするマスクを作る。
 */
export function createChangedPixelMask(
  before: Uint8ClampedArray,
  after: Uint8ClampedArray,
): Uint8Array {
  if (before.length !== after.length || before.length % 4 !== 0) {
    return new Uint8Array(0);
  }

  const mask = new Uint8Array(before.length / 4);

  for (let offset = 0; offset < after.length; offset += 4) {
    if (
      before[offset] !== after[offset] ||
      before[offset + 1] !== after[offset + 1] ||
      before[offset + 2] !== after[offset + 2] ||
      before[offset + 3] !== after[offset + 3]
    ) {
      mask[offset / 4] = 1;
    }
  }

  return mask;
}
