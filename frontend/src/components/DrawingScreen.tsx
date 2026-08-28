import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { DrawMode } from 'shared';
import inyaaOutline from '../assets/inyaa-outline.svg';
import { DRAW_MODES, DRAW_MODE_COPY } from '../constants/drawModes';
import { applyFillToEditingLayer } from '../lib/paint/applyFillToEditingLayer';
import { floodFill, type Rgba } from '../lib/paint/floodFill';
import styles from './DrawingScreen.module.css';

type DrawingScreenProps = {
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
};

type Point = {
  x: number;
  y: number;
};

type Tool = 'pen' | 'eraser' | 'fill';

type HistoryEntry = {
  imageData: ImageData;
  hasDrawing: boolean;
};

const DRAWING_WIDTH = 1000;
const DRAWING_HEIGHT = 600;
const MAX_HISTORY_ENTRIES = 10;

const COLORS = [
  { value: '#1f2937', label: 'くろ' },
  { value: '#ef4444', label: 'あか' },
  { value: '#f59e0b', label: 'オレンジ' },
  { value: '#eab308', label: 'きいろ' },
  { value: '#22c55e', label: 'みどり' },
  { value: '#3b82f6', label: 'あお' },
  { value: '#8b5cf6', label: 'むらさき' },
  { value: '#ec4899', label: 'ピンク' },
] as const;

const LINE_WIDTHS = [4, 8, 16, 24] as const;

const toRgba = (hex: string): Rgba => {
  const value = hex.slice(1);

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
    a: 255,
  };
};

export function DrawingScreen({ mode, onModeChange }: DrawingScreenProps) {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerId = useRef<number | null>(null);
  const previousPoint = useRef<Point | null>(null);
  const isReadyToDraw = useRef(false);
  const hasDrawing = useRef(false);
  const history = useRef<HistoryEntry[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [lineWidth, setLineWidth] = useState<number>(LINE_WIDTHS[1]);
  const [canUndo, setCanUndo] = useState(false);
  const [canClear, setCanClear] = useState(false);
  const copy = DRAW_MODE_COPY[mode];

  const cancelActiveStroke = () => {
    const pointerId = activePointerId.current;
    const canvas = canvasRef.current;

    if (pointerId !== null && canvas?.hasPointerCapture(pointerId)) {
      canvas.releasePointerCapture(pointerId);
    }

    activePointerId.current = null;
    previousPoint.current = null;
  };

  const resetHistory = () => {
    history.current = [];
    setCanUndo(false);
  };

  const saveHistory = (context: CanvasRenderingContext2D) => {
    const entry = {
      imageData: context.getImageData(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT),
      hasDrawing: hasDrawing.current,
    };

    if (history.current.length === MAX_HISTORY_ENTRIES) {
      history.current.shift();
    }

    history.current.push(entry);
    setCanUndo(true);
  };

  useEffect(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    const canvas = canvasRef.current;

    if (backgroundCanvas === null || canvas === null) {
      return;
    }

    const backgroundContext = backgroundCanvas.getContext('2d');
    const context = canvas.getContext('2d');

    if (backgroundContext === null || context === null) {
      return;
    }

    let isCurrent = true;
    isReadyToDraw.current = false;
    cancelActiveStroke();
    hasDrawing.current = false;
    setCanClear(false);
    resetHistory();

    const resetCanvas = () => {
      backgroundContext.clearRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
      backgroundContext.fillStyle = '#ffffff';
      backgroundContext.fillRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
      context.clearRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
    };

    resetCanvas();

    if (mode === 'free') {
      isReadyToDraw.current = true;
      return () => {
        isCurrent = false;
        cancelActiveStroke();
      };
    }

    const outlineImage = new Image();
    outlineImage.onload = () => {
      if (!isCurrent) {
        return;
      }

      const scale = Math.min(
        (DRAWING_WIDTH * 0.7) / outlineImage.naturalWidth,
        (DRAWING_HEIGHT * 0.8) / outlineImage.naturalHeight,
      );
      const width = outlineImage.naturalWidth * scale;
      const height = outlineImage.naturalHeight * scale;

      backgroundContext.drawImage(
        outlineImage,
        (DRAWING_WIDTH - width) / 2,
        (DRAWING_HEIGHT - height) / 2,
        width,
        height,
      );
      isReadyToDraw.current = true;
    };
    outlineImage.onerror = () => {
      if (isCurrent) {
        isReadyToDraw.current = true;
      }
    };
    outlineImage.src = inyaaOutline;

    return () => {
      isCurrent = false;
      cancelActiveStroke();
    };
  }, [mode]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * DRAWING_WIDTH;
    const y = ((event.clientY - bounds.top) / bounds.height) * DRAWING_HEIGHT;

    return {
      x: Math.min(Math.max(Math.floor(x), 0), DRAWING_WIDTH - 1),
      y: Math.min(Math.max(Math.floor(y), 0), DRAWING_HEIGHT - 1),
    };
  };

  const drawDot = (context: CanvasRenderingContext2D, point: Point) => {
    context.beginPath();
    context.arc(point.x, point.y, lineWidth / 2, 0, Math.PI * 2);
    context.fill();
  };

  const configureContext = (context: CanvasRenderingContext2D) => {
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.fillStyle = color;
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  };

  const fillAtPoint = (
    context: CanvasRenderingContext2D,
    editingCanvas: HTMLCanvasElement,
    point: Point,
  ) => {
    const backgroundCanvas = backgroundCanvasRef.current;

    if (backgroundCanvas === null) {
      return;
    }

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = DRAWING_WIDTH;
    compositeCanvas.height = DRAWING_HEIGHT;
    const compositeContext = compositeCanvas.getContext('2d');

    if (compositeContext === null) {
      return;
    }

    compositeContext.drawImage(backgroundCanvas, 0, 0);
    compositeContext.drawImage(editingCanvas, 0, 0);

    const compositeImageData = compositeContext.getImageData(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
    const originalCompositeData = new Uint8ClampedArray(compositeImageData.data);
    const fillColor = toRgba(color);
    const result = floodFill(
      compositeImageData.data,
      DRAWING_WIDTH,
      DRAWING_HEIGHT,
      point.x,
      point.y,
      fillColor,
    );

    // Canvas端へつながる領域は背景とみなし、閉じた領域だけを塗り潰す。
    if (result.aborted || result.touchesEdge || result.filledPixels === 0) {
      return;
    }

    const editingImageData = context.getImageData(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
    const filledMask = new Uint8Array(DRAWING_WIDTH * DRAWING_HEIGHT);

    for (let offset = 0; offset < compositeImageData.data.length; offset += 4) {
      if (
        originalCompositeData[offset] === compositeImageData.data[offset] &&
        originalCompositeData[offset + 1] === compositeImageData.data[offset + 1] &&
        originalCompositeData[offset + 2] === compositeImageData.data[offset + 2] &&
        originalCompositeData[offset + 3] === compositeImageData.data[offset + 3]
      ) {
        continue;
      }

      filledMask[offset / 4] = 1;
    }

    applyFillToEditingLayer(
      editingImageData.data,
      DRAWING_WIDTH,
      DRAWING_HEIGHT,
      filledMask,
      fillColor,
    );

    saveHistory(context);
    context.globalCompositeOperation = 'source-over';
    context.putImageData(editingImageData, 0, 0);
    hasDrawing.current = true;
    setCanClear(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (
      !isReadyToDraw.current ||
      !event.isPrimary ||
      activePointerId.current !== null ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    const context = event.currentTarget.getContext('2d');

    if (context === null) {
      return;
    }

    event.preventDefault();
    const point = getPoint(event);

    if (tool === 'fill') {
      fillAtPoint(context, event.currentTarget, point);
      return;
    }

    saveHistory(context);

    activePointerId.current = event.pointerId;
    previousPoint.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
    configureContext(context);
    drawDot(context, point);
    hasDrawing.current = true;
    setCanClear(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointerId.current !== event.pointerId || previousPoint.current === null) {
      return;
    }

    const context = event.currentTarget.getContext('2d');

    if (context === null) {
      return;
    }

    event.preventDefault();
    const point = getPoint(event);

    configureContext(context);
    context.beginPath();
    context.moveTo(previousPoint.current.x, previousPoint.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    previousPoint.current = point;
  };

  const finishStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    cancelActiveStroke();
  };

  const handleUndo = () => {
    const context = canvasRef.current?.getContext('2d');
    const previousState = history.current.pop();

    if (context === null || context === undefined || previousState === undefined) {
      return;
    }

    context.globalCompositeOperation = 'source-over';
    context.putImageData(previousState.imageData, 0, 0);
    hasDrawing.current = previousState.hasDrawing;
    setCanClear(previousState.hasDrawing);
    setCanUndo(history.current.length > 0);
  };

  const handleClear = () => {
    const context = canvasRef.current?.getContext('2d');

    if (context === null || context === undefined || !hasDrawing.current) {
      return;
    }

    if (!window.confirm('いまのおえかきをぜんぶ消しますか？')) {
      return;
    }

    cancelActiveStroke();
    saveHistory(context);
    context.clearRect(0, 0, DRAWING_WIDTH, DRAWING_HEIGHT);
    hasDrawing.current = false;
    setCanClear(false);
  };

  const handleModeChange = (nextMode: DrawMode) => {
    if (nextMode === mode) {
      return;
    }

    if (
      hasDrawing.current &&
      !window.confirm('モードを切り替えると、現在の絵が消えます。切り替えますか？')
    ) {
      return;
    }

    cancelActiveStroke();
    onModeChange(nextMode);
  };

  return (
    <section className={styles.screen} aria-labelledby="drawing-title">
      <div className={styles.header}>
        <p className={styles.label}>おえかきモード</p>
        <h1 id="drawing-title" className={styles.title}>
          {copy.label}
        </h1>
        <p className={styles.description}>{copy.drawingDescription}</p>
      </div>

      <div className={styles.modeSwitcher} role="group" aria-label="おえかきモードを切り替える">
        {DRAW_MODES.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.modeButton}
            aria-pressed={mode === option}
            onClick={() => handleModeChange(option)}
          >
            {DRAW_MODE_COPY[option].label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar} aria-label="おえかきのどうぐ">
        <div className={styles.toolGroup} role="group" aria-label="どうぐを選ぶ">
          <button
            type="button"
            className={styles.toolButton}
            aria-pressed={tool === 'pen'}
            onClick={() => setTool('pen')}
          >
            ペン
          </button>
          <button
            type="button"
            className={styles.toolButton}
            aria-pressed={tool === 'eraser'}
            onClick={() => setTool('eraser')}
          >
            けしゴム
          </button>
          <button
            type="button"
            className={styles.toolButton}
            aria-pressed={tool === 'fill'}
            onClick={() => setTool('fill')}
          >
            ぬりつぶし
          </button>
        </div>

        <div className={styles.colorGroup} role="group" aria-label="色を選ぶ">
          {COLORS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.colorButton}
              style={{ '--color-swatch': option.value } as CSSProperties}
              aria-label={`${option.label}を選ぶ`}
              aria-pressed={color === option.value}
              onClick={() => setColor(option.value)}
            />
          ))}
        </div>

        <label className={styles.lineWidthLabel}>
          太さ
          <select value={lineWidth} onChange={(event) => setLineWidth(Number(event.target.value))}>
            {LINE_WIDTHS.map((width) => (
              <option key={width} value={width}>
                {width}px
              </option>
            ))}
          </select>
        </label>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.actionButton}
            disabled={!canUndo}
            onClick={handleUndo}
          >
            ひとつ戻す
          </button>
          <button
            type="button"
            className={styles.clearButton}
            disabled={!canClear}
            onClick={handleClear}
          >
            全部消す
          </button>
        </div>
      </div>

      <div className={styles.drawingArea}>
        <canvas
          ref={backgroundCanvasRef}
          className={styles.backgroundCanvas}
          width={DRAWING_WIDTH}
          height={DRAWING_HEIGHT}
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={DRAWING_WIDTH}
          height={DRAWING_HEIGHT}
          role="img"
          aria-label={`${copy.label}の描画エリア`}
          aria-describedby="drawing-instructions"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
        <p id="drawing-instructions" className={styles.drawingHint}>
          {copy.drawingHint}
        </p>
      </div>
    </section>
  );
}
