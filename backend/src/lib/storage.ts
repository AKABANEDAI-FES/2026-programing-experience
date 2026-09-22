import type { DecodedImage } from './image';

export interface SavedImage {
  id: string;
  key: string;
  createdAt: number;
}

export const saveImage = async (bucket: R2Bucket, image: DecodedImage): Promise<SavedImage> => {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const key = `creatures/${createdAt}-${id}.${image.extension}`;

  await bucket.put(key, image.bytes, {
    httpMetadata: { contentType: image.contentType },
  });

  return { id, key, createdAt };
};
