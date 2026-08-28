import { useEffect, useRef, type PointerEvent } from 'react';
import type { DrawMode } from 'shared';
import inyaaOutline from '../assets/inyaa-outline.svg';
import { DRAW_MODES, DRAW_MODE_COPY } from '../constants/drawModes';
import styles from './DrawingScreen.module.css';

type DrawingScreenProps = {
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
};

type Point = {
  x: number;
  y: number;
};

const DRAWING_WIDTH = 1000;
const DRAWING_HEIGHT = 600;
const STROKE_WIDTH = 8;
const DRAWING_COLOR = '#1f2937';

export function DrawingScreen({ mode, onModeChange }: DrawingScreenProps) {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointerId = useRef<number | null>(null);
  const previousPoint = useRef<Point | null>(null);
  const isReadyToDraw = useRef(false);
  const copy = DRAW_MODE_COPY[mode];

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
    activePointerId.current = null;
    previousPoint.current = null;

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
    };
  }, [mode]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * DRAWING_WIDTH;
    const y = ((event.clientY - bounds.top) / bounds.height) * DRAWING_HEIGHT;

    return {
      x: Math.min(Math.max(x, 0), DRAWING_WIDTH),
      y: Math.min(Math.max(y, 0), DRAWING_HEIGHT),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (
      !isReadyToDraw.current ||
      activePointerId.current !== null ||
      (event.pointerType === 'mouse' && event.button !== 0)
    ) {
      return;
    }

    const point = getPoint(event);
    const context = event.currentTarget.getContext('2d');

    if (context === null) {
      return;
    }

    activePointerId.current = event.pointerId;
    previousPoint.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);

    context.beginPath();
    context.arc(point.x, point.y, STROKE_WIDTH / 2, 0, Math.PI * 2);
    context.fillStyle = DRAWING_COLOR;
    context.fill();
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (activePointerId.current !== event.pointerId || previousPoint.current === null) {
      return;
    }

    const point = getPoint(event);
    const context = event.currentTarget.getContext('2d');

    if (context === null) {
      return;
    }

    context.beginPath();
    context.moveTo(previousPoint.current.x, previousPoint.current.y);
    context.lineTo(point.x, point.y);
    context.strokeStyle = DRAWING_COLOR;
    context.lineWidth = STROKE_WIDTH;
    context.lineCap = 'round';
    context.lineJoin = 'round';
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

    activePointerId.current = null;
    previousPoint.current = null;
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
            onClick={() => onModeChange(option)}
          >
            {DRAW_MODE_COPY[option].label}
          </button>
        ))}
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
        <p className={styles.drawingHint}>{copy.drawingHint}</p>
      </div>
    </section>
  );
}
