import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_CREATURES } from 'shared/release';
import { addCreature } from '../../src/lib/display/creatureQueue.ts';

const creature = (id: string) => ({ id });

const fill = (count: number) => Array.from({ length: count }, (_, index) => creature(`c${index}`));

test('上限に達するまではそのまま末尾に追加する', () => {
  const result = addCreature([creature('a')], creature('b'), 3);

  assert.deepEqual(result, { creatures: [creature('a'), creature('b')], removed: [] });
});

test('上限を超えたら最も古い作品を取り除く', () => {
  const result = addCreature([creature('a'), creature('b'), creature('c')], creature('d'), 3);

  assert.deepEqual(result, {
    creatures: [creature('b'), creature('c'), creature('d')],
    removed: [creature('a')],
  });
});

test('31匹目が届くと1匹目が取り除かれ、30匹のままになる', () => {
  const current = fill(MAX_CREATURES);
  const result = addCreature(current, creature('new'), MAX_CREATURES);

  assert.equal(result.creatures.length, MAX_CREATURES);
  assert.deepEqual(result.removed, [creature('c0')]);
  assert.deepEqual(result.creatures.at(-1), creature('new'));
});

test('同じ作品が二重に届いた場合は何もしない', () => {
  const current = [creature('a'), creature('b')];
  const result = addCreature(current, creature('a'), 3);

  assert.equal(result.creatures, current);
  assert.deepEqual(result.removed, []);
});
