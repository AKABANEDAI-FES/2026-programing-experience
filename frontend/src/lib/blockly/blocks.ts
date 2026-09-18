import * as Blockly from 'blockly';
import {
  DEFAULT_SAY_TEXT,
  MOTION_FIELD_NAME,
  MOTION_OPTIONS,
  MOVE_BLOCK_TYPE,
  SAY_BLOCK_TYPE,
  TEXT_FIELD_NAME,
} from './commandSchema.ts';

export const defineCommandBlocks = () => {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: MOVE_BLOCK_TYPE,
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: MOTION_FIELD_NAME,
          options: MOTION_OPTIONS,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 200,
      tooltip: 'キャラクターの うごきを えらびます',
    },
    {
      type: SAY_BLOCK_TYPE,
      message0: '%1 と いう',
      args0: [
        {
          type: 'field_input',
          name: TEXT_FIELD_NAME,
          text: DEFAULT_SAY_TEXT,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: 'キャラクターに しゃべらせる ことばを きめます',
    },
  ]);
};
