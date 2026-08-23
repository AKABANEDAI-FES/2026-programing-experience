import { MAX_COMMANDS, type ReleaseRequest } from 'shared';

const PNG_DATA_URL_PATTERN =
  /^data:image\/png;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export type ReleaseRequestValidationResult =
  { success: true; data: ReleaseRequest } | { success: false; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const validateCommand = (command: unknown, index: number): string | null => {
  if (!isRecord(command)) {
    return `commands[${index}] はオブジェクトで指定してください`;
  }

  if (command.type === 'move') {
    return typeof command.motion === 'string'
      ? null
      : `commands[${index}].motion は文字列で指定してください`;
  }

  if (command.type === 'say') {
    return typeof command.text === 'string'
      ? null
      : `commands[${index}].text は文字列で指定してください`;
  }

  return `commands[${index}].type は "move" または "say" を指定してください`;
};

export const validateReleaseRequest = (value: unknown): ReleaseRequestValidationResult => {
  if (!isRecord(value)) {
    return { success: false, message: 'リクエストボディはオブジェクトで指定してください' };
  }

  if (value.mode !== 'free' && value.mode !== 'coloring') {
    return { success: false, message: 'mode は "free" または "coloring" を指定してください' };
  }

  if (typeof value.image_base64 !== 'string' || !PNG_DATA_URL_PATTERN.test(value.image_base64)) {
    return {
      success: false,
      message: 'image_base64 はPNG画像のData URL形式で指定してください',
    };
  }

  if (!Array.isArray(value.commands)) {
    return { success: false, message: 'commands は配列で指定してください' };
  }

  if (value.commands.length > MAX_COMMANDS) {
    return {
      success: false,
      message: `commands は${MAX_COMMANDS}個以下で指定してください`,
    };
  }

  for (const [index, command] of value.commands.entries()) {
    const errorMessage = validateCommand(command, index);

    if (errorMessage !== null) {
      return { success: false, message: errorMessage };
    }
  }

  return {
    success: true,
    data: {
      mode: value.mode,
      image_base64: value.image_base64,
      commands: value.commands as ReleaseRequest['commands'],
    },
  };
};
