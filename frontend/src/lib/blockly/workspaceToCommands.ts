import type { Command, Motion } from 'shared';
import {
  MOTION_FIELD_NAME,
  MOVE_BLOCK_TYPE,
  SAY_BLOCK_TYPE,
  TEXT_FIELD_NAME,
} from './commandSchema.ts';

type BlockState = {
  type?: string;
  x?: number;
  y?: number;
  fields?: Record<string, unknown>;
  next?: { block?: BlockState };
};

type WorkspaceState = {
  blocks?: { blocks?: BlockState[] };
};

const toCommand = (block: BlockState): Command | null => {
  const fields = block.fields ?? {};

  if (block.type === MOVE_BLOCK_TYPE) {
    return { type: 'move', motion: fields[MOTION_FIELD_NAME] as Motion };
  }

  if (block.type === SAY_BLOCK_TYPE) {
    return { type: 'say', text: String(fields[TEXT_FIELD_NAME] ?? '') };
  }

  return null;
};

/** Blockly.serialization.workspaces.save() の出力を、上に置かれたブロックから順に変換する */
export const workspaceToCommands = (workspaceJson: unknown): Command[] => {
  const topBlocks = [...((workspaceJson as WorkspaceState)?.blocks?.blocks ?? [])];
  topBlocks.sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));

  const commands: Command[] = [];

  for (const topBlock of topBlocks) {
    let block: BlockState | undefined = topBlock;

    while (block !== undefined) {
      const command = toCommand(block);

      if (command !== null) {
        commands.push(command);
      }

      block = block.next?.block;
    }
  }

  return commands;
};
