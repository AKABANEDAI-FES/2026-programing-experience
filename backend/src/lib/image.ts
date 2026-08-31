export interface DecodedImage {
  bytes: Uint8Array;
  contentType: string;
  extension: string;
}

export type DecodeImageResult =
  { success: true; image: DecodedImage } | { success: false; message: string };

const SUPPORTED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};

const DATA_URL_PATTERN = /^data:([\w.+-]+\/[\w.+-]+);base64,([\s\S]+)$/;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

const hasSignature = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((byte, index) => bytes[index] === byte);

const looksLikeImage = (bytes: Uint8Array, contentType: string): boolean => {
  switch (contentType) {
    case 'image/png':
      return hasSignature(bytes, PNG_SIGNATURE);
    case 'image/jpeg':
      return hasSignature(bytes, JPEG_SIGNATURE);
    case 'image/svg+xml':
      return new TextDecoder().decode(bytes.slice(0, 1024)).toLowerCase().includes('<svg');
    default:
      return false;
  }
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

export const decodeImageDataUrl = (imageBase64: string): DecodeImageResult => {
  const matched = imageBase64.match(DATA_URL_PATTERN);

  if (!matched) {
    return { success: false, message: '画像データがData URL形式ではありません' };
  }

  const contentType = matched[1].toLowerCase();
  const extension = SUPPORTED_IMAGE_TYPES[contentType];

  if (!extension) {
    return { success: false, message: `対応していない画像形式です: ${contentType}` };
  }

  const bytes = base64ToBytes(matched[2]);

  if (!bytes || bytes.length === 0) {
    return { success: false, message: '画像データをデコードできませんでした' };
  }

  if (!looksLikeImage(bytes, contentType)) {
    return { success: false, message: '画像として読み込めないデータです' };
  }

  return { success: true, image: { bytes, contentType, extension } };
};
