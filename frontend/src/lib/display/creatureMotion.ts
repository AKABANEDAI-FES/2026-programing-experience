import type { Command } from 'shared';

export const CREATURE_WIDTH = 220;
export const CREATURE_HEIGHT = 132;

const JUMP_HEIGHT = 140;
const MOVE_DURATION_MS = 1000;
const SAY_DURATION_MS = 2500;

export type Bounds = {
  width: number;
  height: number;
};

export type CreatureMotion = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  commandIndex: number;
  commandElapsed: number;
};

export type CreatureVisual = {
  x: number;
  y: number;
  rotation: number;
  facing: 1 | -1;
  sayText: string | null;
};

export const commandDurationMs = (command: Command): number =>
  command.type === 'say' ? SAY_DURATION_MS : MOVE_DURATION_MS;

export const createMotion = (
  bounds: Bounds,
  random: () => number = Math.random,
): CreatureMotion => {
  const speed = 40 + random() * 40;

  return {
    x: random() * Math.max(0, bounds.width - CREATURE_WIDTH),
    y: random() * Math.max(0, bounds.height - CREATURE_HEIGHT),
    vx: random() < 0.5 ? -speed : speed,
    vy: (random() - 0.5) * 30,
    commandIndex: 0,
    commandElapsed: 0,
  };
};

export const stepMotion = (
  motion: CreatureMotion,
  commands: Command[],
  deltaMs: number,
  bounds: Bounds,
): CreatureMotion => {
  const seconds = deltaMs / 1000;
  const maxX = Math.max(0, bounds.width - CREATURE_WIDTH);
  const maxY = Math.max(0, bounds.height - CREATURE_HEIGHT);

  let { x, y, vx, vy, commandIndex, commandElapsed } = motion;

  x += vx * seconds;
  y += vy * seconds;

  if (x <= 0) {
    x = 0;
    vx = Math.abs(vx);
  } else if (x >= maxX) {
    x = maxX;
    vx = -Math.abs(vx);
  }

  if (y <= 0) {
    y = 0;
    vy = Math.abs(vy);
  } else if (y >= maxY) {
    y = maxY;
    vy = -Math.abs(vy);
  }

  if (commands.length === 0) {
    return { x, y, vx, vy, commandIndex: 0, commandElapsed: 0 };
  }

  commandIndex %= commands.length;
  commandElapsed += deltaMs;

  while (commandElapsed >= commandDurationMs(commands[commandIndex])) {
    commandElapsed -= commandDurationMs(commands[commandIndex]);
    commandIndex = (commandIndex + 1) % commands.length;
  }

  return { x, y, vx, vy, commandIndex, commandElapsed };
};

export const toVisual = (motion: CreatureMotion, commands: Command[]): CreatureVisual => {
  const command = commands.length > 0 ? commands[motion.commandIndex % commands.length] : undefined;
  const progress = command === undefined ? 0 : motion.commandElapsed / commandDurationMs(command);
  const isMove = command?.type === 'move';

  return {
    x: motion.x,
    y:
      motion.y -
      (isMove && command.motion === 'jump' ? Math.sin(progress * Math.PI) * JUMP_HEIGHT : 0),
    rotation: isMove && command.motion === 'spin' ? progress * 360 : 0,
    facing: motion.vx < 0 ? -1 : 1,
    sayText: command?.type === 'say' ? command.text : null,
  };
};
