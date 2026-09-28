import assert from 'node:assert/strict';
import test from 'node:test';
import { createCreatureAddedMessage, normalizeCloseCode } from '../src/lib/display.ts';

const saved = {
  id: '12345678-1234-4234-8234-123456789abc',
  key: 'creatures/1789452946224-12345678-1234-4234-8234-123456789abc.png',
  createdAt: 1789452946224,
};

test('自由描画の放流から保存キーを含む通知メッセージを作る', () => {
  const commands = [
    { type: 'move', motion: 'jump' },
    { type: 'say', text: 'こんにちは' },
  ];

  const message = createCreatureAddedMessage(saved, 'free', commands);

  assert.deepEqual(message, {
    type: 'creature_added',
    creature: {
      id: saved.id,
      mode: 'free',
      imageUrl: saved.key,
      commands,
      createdAt: saved.createdAt,
    },
  });
  assert.equal(message.creature.commands, commands);
});

test('塗り絵の放流ではcoloringをそのまま使う', () => {
  const message = createCreatureAddedMessage(saved, 'coloring', []);

  assert.equal(message.creature.mode, 'coloring');
  assert.deepEqual(message.creature.commands, []);
});

test('modeが不正な値や未指定の場合はfreeにする', () => {
  for (const mode of ['invalid', 'COLORING', '', undefined, null, 123, true, {}, []]) {
    const message = createCreatureAddedMessage(saved, mode, []);

    assert.equal(message.creature.mode, 'free');
  }
});

test('commandsが配列でない場合は空配列にする', () => {
  for (const commands of [undefined, null, 'commands', 123, true, {}, { length: 1 }]) {
    const message = createCreatureAddedMessage(saved, 'free', commands);

    assert.deepEqual(message.creature.commands, []);
  }
});

test('closeコードが1000または3000から4999の整数ならそのまま使う', () => {
  for (const code of [1000, 3000, 4000, 4999]) {
    assert.equal(normalizeCloseCode(code), code);
  }
});

test('使用できないcloseコードは1000にする', () => {
  for (const code of [1005, 1006, 0, 5000, 1001, 1011, 2999, 3000.5, NaN, Infinity]) {
    assert.equal(normalizeCloseCode(code), 1000);
  }
});
