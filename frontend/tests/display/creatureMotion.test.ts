import assert from 'node:assert/strict';
import test from 'node:test';
import type { Command } from 'shared';
import {
  CREATURE_WIDTH,
  createMotion,
  stepMotion,
  toVisual,
  type CreatureMotion,
} from '../../src/lib/display/creatureMotion.ts';

const BOUNDS = { width: 1000, height: 600 };

const motionAt = (overrides: Partial<CreatureMotion> = {}): CreatureMotion => ({
  x: 100,
  y: 100,
  vx: 60,
  vy: 0,
  commandIndex: 0,
  commandElapsed: 0,
  ...overrides,
});

test('速度に応じて位置が進む', () => {
  const next = stepMotion(motionAt(), [], 1000, BOUNDS);

  assert.equal(next.x, 160);
});

test('右端に到達すると向きが反転する', () => {
  const next = stepMotion(motionAt({ x: BOUNDS.width - CREATURE_WIDTH, vx: 60 }), [], 1000, BOUNDS);

  assert.equal(next.x, BOUNDS.width - CREATURE_WIDTH);
  assert.equal(next.vx, -60);
});

test('左端に到達すると向きが反転する', () => {
  const next = stepMotion(motionAt({ x: 0, vx: -60 }), [], 1000, BOUNDS);

  assert.equal(next.x, 0);
  assert.equal(next.vx, 60);
});

test('時間が経つと次のコマンドへ進む', () => {
  const commands: Command[] = [
    { type: 'move', motion: 'jump' },
    { type: 'move', motion: 'spin' },
  ];

  const next = stepMotion(motionAt(), commands, 1200, BOUNDS);

  assert.equal(next.commandIndex, 1);
  assert.equal(next.commandElapsed, 200);
});

test('最後のコマンドまで進むと先頭へ戻る', () => {
  const commands: Command[] = [
    { type: 'move', motion: 'jump' },
    { type: 'move', motion: 'spin' },
  ];

  const next = stepMotion(
    motionAt({ commandIndex: 1, commandElapsed: 900 }),
    commands,
    200,
    BOUNDS,
  );

  assert.equal(next.commandIndex, 0);
});

test('コマンドがない場合も漂い続ける', () => {
  const next = stepMotion(motionAt(), [], 500, BOUNDS);

  assert.equal(next.commandIndex, 0);
  assert.equal(next.commandElapsed, 0);
  assert.equal(next.x, 130);
});

test('ジャンプの途中では上に持ち上がる', () => {
  const commands: Command[] = [{ type: 'move', motion: 'jump' }];
  const visual = toVisual(motionAt({ commandElapsed: 500 }), commands);

  assert.ok(visual.y < 100);
});

test('回転コマンドでは進み具合に応じて角度がつく', () => {
  const commands: Command[] = [{ type: 'move', motion: 'spin' }];
  const visual = toVisual(motionAt({ commandElapsed: 500 }), commands);

  assert.equal(visual.rotation, 180);
});

test('セリフコマンドではテキストを返す', () => {
  const commands: Command[] = [{ type: 'say', text: 'こんにちは' }];

  assert.equal(toVisual(motionAt(), commands).sayText, 'こんにちは');
  assert.equal(toVisual(motionAt(), []).sayText, null);
});

test('左へ進むときは向きが反転する', () => {
  assert.equal(toVisual(motionAt({ vx: -60 }), []).facing, -1);
  assert.equal(toVisual(motionAt({ vx: 60 }), []).facing, 1);
});

test('初期位置は画面の内側に収まる', () => {
  const motion = createMotion(BOUNDS, () => 0.999);

  assert.ok(motion.x <= BOUNDS.width - CREATURE_WIDTH);
  assert.ok(motion.y >= 0);
});
