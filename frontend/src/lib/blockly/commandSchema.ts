import type { Motion } from 'shared';

export const MOVE_BLOCK_TYPE = 'move_command';
export const SAY_BLOCK_TYPE = 'say_command';

export const MOTION_FIELD_NAME = 'MOTION';
export const TEXT_FIELD_NAME = 'TEXT';

export const DEFAULT_SAY_TEXT = 'こんにちは';

export const MOTION_OPTIONS: [label: string, motion: Motion][] = [
  ['およぐ', 'swim'],
  ['ジャンプする', 'jump'],
  ['くるっとまわる', 'spin'],
];
