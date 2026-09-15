import assert from 'node:assert/strict';
import test from 'node:test';
import { saveImage } from '../src/lib/storage.ts';

const createImage = () => ({
  bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
  contentType: 'image/png',
  extension: 'png',
});

const createBucket = () => {
  const calls: { key: string; value: unknown; options: unknown }[] = [];

  return {
    calls,
    put: async (key: string, value: unknown, options: unknown) => {
      calls.push({ key, value, options });
    },
  };
};

test('タイムスタンプとUUIDを含むキーで画像を保存する', async () => {
  const bucket = createBucket();
  const image = createImage();

  const saved = await saveImage(bucket, image);

  assert.equal(bucket.calls.length, 1);
  assert.match(
    bucket.calls[0].key,
    /^creatures\/\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
  );
  assert.equal(bucket.calls[0].key, `creatures/${saved.createdAt}-${saved.id}.png`);
  assert.equal(saved.key, bucket.calls[0].key);
  assert.equal(bucket.calls[0].value, image.bytes);
});

test('Content-Type を付けて保存する', async () => {
  const bucket = createBucket();

  await saveImage(bucket, createImage());

  assert.deepEqual(bucket.calls[0].options, { httpMetadata: { contentType: 'image/png' } });
});

test('保存のたびに異なるキーを使う', async () => {
  const bucket = createBucket();

  const first = await saveImage(bucket, createImage());
  const second = await saveImage(bucket, createImage());

  assert.notEqual(first.id, second.id);
  assert.notEqual(first.key, second.key);
});

test('R2への保存に失敗した場合はエラーをそのまま投げる', async () => {
  const bucket = {
    put: async () => {
      throw new Error('R2 unavailable');
    },
  };

  await assert.rejects(saveImage(bucket, createImage()), /R2 unavailable/);
});
