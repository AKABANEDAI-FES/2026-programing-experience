export interface DecodedImage {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
}

export type DecodeImageResult =
  { success: true; image: DecodedImage } | { success: false; message: string };

const PNG_CONTENT_TYPE = 'image/png';
const PNG_EXTENSION = 'png';

const DATA_URL_PATTERN = /^data:([\w.+-]+\/[\w.+-]+);base64,([\s\S]+)$/;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const CHUNK_HEADER_LENGTH = 8;
const CHUNK_CRC_LENGTH = 4;
const IHDR_DATA_LENGTH = 13;

const matchesBytes = (bytes: Uint8Array, expected: number[], offset: number): boolean =>
  expected.every((byte, index) => bytes[offset + index] === byte);

const readUint32 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]) >>>
  0;

const readChunkType = (bytes: Uint8Array, offset: number): string =>
  String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);

const validatePng = (bytes: Uint8Array): string | null => {
  if (!matchesBytes(bytes, PNG_SIGNATURE, 0)) {
    return 'PNG形式の画像ではありません';
  }

  let offset = PNG_SIGNATURE.length;
  let isFirstChunk = true;
  let hasImageData = false;

  while (offset + CHUNK_HEADER_LENGTH <= bytes.length) {
    const dataLength = readUint32(bytes, offset);
    const chunkType = readChunkType(bytes, offset + 4);
    const nextOffset = offset + CHUNK_HEADER_LENGTH + dataLength + CHUNK_CRC_LENGTH;

    if (isFirstChunk) {
      if (chunkType !== 'IHDR' || dataLength !== IHDR_DATA_LENGTH) {
        return 'PNG画像の構造が壊れています';
      }

      if (nextOffset > bytes.length) {
        return '画像データが途中で切れています';
      }

      const width = readUint32(bytes, offset + CHUNK_HEADER_LENGTH);
      const height = readUint32(bytes, offset + CHUNK_HEADER_LENGTH + 4);

      if (width === 0 || height === 0) {
        return 'PNG画像の構造が壊れています';
      }

      isFirstChunk = false;
    }

    if (nextOffset > bytes.length) {
      return '画像データが途中で切れています';
    }

    if (chunkType === 'IDAT' && dataLength > 0) {
      hasImageData = true;
    }

    if (chunkType === 'IEND') {
      if (!hasImageData) {
        return '画像データが含まれていません';
      }

      return nextOffset === bytes.length ? null : 'PNG画像の構造が壊れています';
    }

    offset = nextOffset;
  }

  return '画像データが途中で切れています';
};

const base64ToBytes = (base64: string): Uint8Array | null => {
  try {
    const binary = atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch {
    return null;
  }
};

export const decodeImageDataUrl = (imageBase64: unknown): DecodeImageResult => {
  if (typeof imageBase64 !== 'string') {
    return { success: false, message: '画像データが指定されていません' };
  }

  const matched = imageBase64.match(DATA_URL_PATTERN);

  if (!matched) {
    return { success: false, message: '画像データがData URL形式ではありません' };
  }

  const contentType = matched[1].toLowerCase();

  if (contentType !== PNG_CONTENT_TYPE) {
    return { success: false, message: `対応していない画像形式です: ${contentType}` };
  }

  const bytes = base64ToBytes(matched[2]);

  if (!bytes) {
    return { success: false, message: '画像データをデコードできませんでした' };
  }

  const invalidReason = validatePng(bytes);

  if (invalidReason) {
    return { success: false, message: invalidReason };
  }

  return {
    success: true,
    image: { bytes, contentType: PNG_CONTENT_TYPE, extension: PNG_EXTENSION },
  };
};
