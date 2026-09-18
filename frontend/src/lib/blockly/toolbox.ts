import * as Blockly from 'blockly';
import { MOVE_BLOCK_TYPE, SAY_BLOCK_TYPE } from './commandSchema.ts';

export const TOOLBOX: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'うごき',
      colour: '200',
      contents: [{ kind: 'block', type: MOVE_BLOCK_TYPE }],
    },
    {
      kind: 'category',
      name: 'セリフ',
      colour: '160',
      contents: [{ kind: 'block', type: SAY_BLOCK_TYPE }],
    },
  ],
};
