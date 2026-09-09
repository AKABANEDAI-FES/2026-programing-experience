import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeImageDataUrl } from '../src/lib/image.ts';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const toBase64 = (bytes: Uint8Array): string => {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

const toBytes = (base64: string): Uint8Array =>
  Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const buildChunk = (type: string, data: Uint8Array = new Uint8Array()): number[] => {
  const header = [
    (data.length >>> 24) & 0xff,
    (data.length >>> 16) & 0xff,
    (data.length >>> 8) & 0xff,
    data.length & 0xff,
    ...[...type].map((character) => character.charCodeAt(0)),
  ];

  return [...header, ...data, 0, 0, 0, 0];
};

const buildIhdrData = (width = 1, height = 1): Uint8Array => {
  const data = new Uint8Array(13);

  data.set([(width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff], 0);
  data.set(
    [(height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff],
    4,
  );
  data[8] = 8;
  data[9] = 6;

  return data;
};

const buildDataUrl = (...chunks: number[][]): string =>
  `data:image/png;base64,${toBase64(new Uint8Array([...SIGNATURE, ...chunks.flat()]))}`;

test('正常なPNGのData URLをバイナリへ変換する', () => {
  const result = decodeImageDataUrl(`data:image/png;base64,${PNG_BASE64}`);

  assert.equal(result.success, true);
  assert.ok(result.success);
  assert.equal(result.image.contentType, 'image/png');
  assert.equal(result.image.extension, 'png');
  assert.deepEqual(
    [...result.image.bytes.slice(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  );
});

test('改行を含むBase64も変換できる', () => {
  const wrapped = `${PNG_BASE64.slice(0, 20)}\n${PNG_BASE64.slice(20)}`;

  const result = decodeImageDataUrl(`data:image/png;base64,${wrapped}`);

  assert.equal(result.success, true);
});

test('image_base64 が指定されていない場合はエラーを返す', () => {
  const result = decodeImageDataUrl(undefined);

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, '画像データが指定されていません');
});

test('image_base64 が文字列以外の場合はエラーを返す', () => {
  for (const value of [123, null, {}, ['data:image/png;base64,']]) {
    const result = decodeImageDataUrl(value);

    assert.equal(result.success, false);
  }
});

test('Data URL形式でない場合はエラーを返す', () => {
  const result = decodeImageDataUrl(PNG_BASE64);

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, '画像データがData URL形式ではありません');
});

test('PNG以外の画像形式は受け付けない', () => {
  for (const contentType of ['image/jpeg', 'image/svg+xml', 'image/gif']) {
    const result = decodeImageDataUrl(`data:${contentType};base64,${PNG_BASE64}`);

    assert.equal(result.success, false);
    assert.ok(!result.success);
    assert.equal(result.message, `対応していない画像形式です: ${contentType}`);
  }
});

test('Base64として壊れている場合はエラーを返す', () => {
  const result = decodeImageDataUrl('data:image/png;base64,@@@@');

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, '画像データをデコードできませんでした');
});

test('PNGではないデータはエラーを返す', () => {
  const result = decodeImageDataUrl(`data:image/png;base64,${btoa('hello world')}`);

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, 'PNG形式の画像ではありません');
});

test('途中で切れたPNGはエラーを返す', () => {
  const truncated = toBytes(PNG_BASE64).slice(0, -10);

  const result = decodeImageDataUrl(`data:image/png;base64,${toBase64(truncated)}`);

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, '画像データが途中で切れています');
});

test('PNG本体を含まないデータ（シグネチャとIENDのみ）を拒否する', () => {
  const result = decodeImageDataUrl('data:image/png;base64,iVBORw0KGgpJRU5ErkJggg==');

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, 'PNG画像の構造が壊れています');
});

test('IHDRチャンクで始まらないPNGを拒否する', () => {
  const result = decodeImageDataUrl(
    buildDataUrl(buildChunk('IDAT', new Uint8Array([1, 2, 3])), buildChunk('IEND')),
  );

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, 'PNG画像の構造が壊れています');
});

test('IDATチャンクがないPNGを拒否する', () => {
  const result = decodeImageDataUrl(
    buildDataUrl(buildChunk('IHDR', buildIhdrData()), buildChunk('IEND')),
  );

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, '画像データが含まれていません');
});

test('チャンク長が実データより大きいPNGを拒否する', () => {
  const chunk = buildChunk('IDAT', new Uint8Array([1, 2, 3]));
  chunk[3] = 99;

  const result = decodeImageDataUrl(
    buildDataUrl(buildChunk('IHDR', buildIhdrData()), chunk, buildChunk('IEND')),
  );

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, '画像データが途中で切れています');
});

test('IENDの後ろに余分なデータがあるPNGを拒否する', () => {
  const result = decodeImageDataUrl(
    buildDataUrl(
      buildChunk('IHDR', buildIhdrData()),
      buildChunk('IDAT', new Uint8Array([1, 2, 3])),
      buildChunk('IEND'),
      [0, 0, 0, 0],
    ),
  );

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, 'PNG画像の構造が壊れています');
});

test('幅や高さが0のPNGを拒否する', () => {
  const result = decodeImageDataUrl(
    buildDataUrl(
      buildChunk('IHDR', buildIhdrData(0, 1)),
      buildChunk('IDAT', new Uint8Array([1, 2, 3])),
      buildChunk('IEND'),
    ),
  );

  assert.equal(result.success, false);
  assert.ok(!result.success);
  assert.equal(result.message, 'PNG画像の構造が壊れています');
});
