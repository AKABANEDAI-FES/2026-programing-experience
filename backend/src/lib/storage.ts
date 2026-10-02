import type { Command } from 'shared';
import type { DecodedImage } from './image';

export interface SavedImage {
  id: string;
  key: string;
  createdAt: number;
}

export const saveImage = async (
  bucket: R2Bucket,
  image: DecodedImage,
  commands: Command[],
): Promise<SavedImage> => {
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const key = `creatures/${createdAt}-${id}.${image.extension}`;

  await bucket.put(key, image.bytes, {
    httpMetadata: { contentType: image.contentType },
    customMetadata: { commands: JSON.stringify(commands) },
  });

  return { id, key, createdAt };
};
