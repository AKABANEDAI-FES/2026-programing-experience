export type DrawMode = "free" | "coloring";

export type MotionType = "swim" | "jump" | "spin";
export type SpeedType = "slow" | "normal" | "fast";

export interface MoveCommand {
  type: "move";
  motion: MotionType;
}

export interface SpeedCommand {
  type: "speed";
  value: SpeedType;
}

export interface SayCommand {
  type: "say";
  text: string;
}

export type Command = MoveCommand | SpeedCommand | SayCommand;

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
  creature?: import("./display").Creature;
}

export interface ReleaseErrorResponse {
  success: false;
  message: string;
}

export type ReleaseResponse = ReleaseSuccessResponse | ReleaseErrorResponse;
