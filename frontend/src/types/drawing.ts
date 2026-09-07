import type { DrawMode } from 'shared';

export type DrawingHistoryEntry = {
  imageData: ImageData;
  hasDrawing: boolean;
};

export type BackgroundSource = {
  id: string;
  src: string | null;
};

export type DrawingCache = {
  mode: DrawMode;
  backgroundSource: BackgroundSource;
  backgroundImageData: ImageData;
  editingImageData: ImageData;
  history: DrawingHistoryEntry[];
  hasDrawing: boolean;
};

export type DrawingResult = {
  imageData: string;
  drawingCache: DrawingCache;
};
