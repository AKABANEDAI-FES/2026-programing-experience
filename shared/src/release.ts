export type DrawMode = 'free' | 'coloring';

export interface MoveCommand {
  type: 'move';
  /** #9 で確定。確定したら 'swim' | 'jump' などのユニオン型に絞る */
  motion: string;
}

export interface SayCommand {
  type: 'say';
  text: string;
}

export type Command = MoveCommand | SayCommand;

/** 画面③で追加できるコマンドの上限 */
export const MAX_COMMANDS = 5;

/** 大画面に同時表示する生き物の上限。超えたら古い順に削除（FIFO） */
export const MAX_CREATURES = 30;

/** POST /api/release のリクエストボディ */
export interface ReleaseRequest {
  mode: DrawMode;
  image_base64: string; // Data URL 形式: "data:image/png;base64,..."
  commands: Command[];
}

export interface ReleaseSuccessResponse {
  success: true;
  message: string;
}

export interface ReleaseErrorResponse {
  success: false;
  message: string;
}

export type ReleaseResponse = ReleaseSuccessResponse | ReleaseErrorResponse;
