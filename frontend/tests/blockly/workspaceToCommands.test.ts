import assert from 'node:assert/strict';
import test from 'node:test';
import { workspaceToCommands } from '../../src/lib/blockly/workspaceToCommands.ts';

const moveBlock = (motion: string, rest: Record<string, unknown> = {}) => ({
  type: 'move_command',
  fields: { MOTION: motion },
  ...rest,
});

const sayBlock = (text: string, rest: Record<string, unknown> = {}) => ({
  type: 'say_command',
  fields: { TEXT: text },
  ...rest,
});

const workspace = (...blocks: unknown[]) => ({ blocks: { languageVersion: 0, blocks } });

test('つながったブロックを上から順にCommand[]へ変換する', () => {
  const json = workspace(
    moveBlock('swim', {
      x: 20,
      y: 20,
      next: { block: sayBlock('こんにちは', { next: { block: moveBlock('jump') } }) },
    }),
  );

  assert.deepEqual(workspaceToCommands(json), [
    { type: 'move', motion: 'swim' },
    { type: 'say', text: 'こんにちは' },
    { type: 'move', motion: 'jump' },
  ]);
});

test('離れて置かれたブロックは上にあるものから順に変換する', () => {
  const json = workspace(moveBlock('spin', { x: 10, y: 200 }), sayBlock('やあ', { x: 10, y: 20 }));

  assert.deepEqual(workspaceToCommands(json), [
    { type: 'say', text: 'やあ' },
    { type: 'move', motion: 'spin' },
  ]);
});

test('ブロックがない場合は空の配列を返す', () => {
  assert.deepEqual(workspaceToCommands(workspace()), []);
  assert.deepEqual(workspaceToCommands({}), []);
});

test('コマンド以外のブロックは無視する', () => {
  const json = workspace({
    type: 'controls_if',
    next: { block: sayBlock('ここは のこる') },
  });

  assert.deepEqual(workspaceToCommands(json), [{ type: 'say', text: 'ここは のこる' }]);
});
