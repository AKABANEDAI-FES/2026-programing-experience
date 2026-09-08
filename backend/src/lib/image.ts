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
const PNG_TRAILER = [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82];

const matchesBytes = (bytes: Uint8Array, expected: number[], offset: number): boolean =>
  expected.every((byte, index) => bytes[offset + index] === byte);

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

  if (!matchesBytes(bytes, PNG_SIGNATURE, 0)) {
    return { success: false, message: 'PNG形式の画像ではありません' };
  }

  if (
    bytes.length < PNG_SIGNATURE.length + PNG_TRAILER.length ||
    !matchesBytes(bytes, PNG_TRAILER, bytes.length - PNG_TRAILER.length)
  ) {
    return { success: false, message: '画像データが途中で切れています' };
  }

  return {
    success: true,
    image: { bytes, contentType: PNG_CONTENT_TYPE, extension: PNG_EXTENSION },
  };
};
