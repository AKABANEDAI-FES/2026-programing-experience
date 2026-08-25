import { useRef, useState, type PointerEvent } from 'react';
import type { DrawMode } from 'shared';
import styles from './DrawingScreen.module.css';

type DrawingScreenProps = {
  mode: DrawMode;
};

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: number;
  points: Point[];
};

const DRAWING_WIDTH = 1000;
const DRAWING_HEIGHT = 600;
const STROKE_WIDTH = 8;

const modeLabels: Record<DrawMode, string> = {
  free: '自由にお絵かき',
  coloring: 'イニャーの塗り絵',
};

export function DrawingScreen({ mode }: DrawingScreenProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const activePointerId = useRef<number | null>(null);
  const nextStrokeId = useRef(0);

  const getPoint = (event: PointerEvent<SVGSVGElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * DRAWING_WIDTH;
    const y = ((event.clientY - bounds.top) / bounds.height) * DRAWING_HEIGHT;

    return {
      x: Math.min(Math.max(x, 0), DRAWING_WIDTH),
      y: Math.min(Math.max(y, 0), DRAWING_HEIGHT),
    };
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const point = getPoint(event);
    const strokeId = nextStrokeId.current;

    nextStrokeId.current += 1;
    activePointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setStrokes((currentStrokes) => [...currentStrokes, { id: strokeId, points: [point, point] }]);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    const point = getPoint(event);

    setStrokes((currentStrokes) => {
      const activeStroke = currentStrokes.at(-1);

      if (activeStroke === undefined) {
        return currentStrokes;
      }

      return [
        ...currentStrokes.slice(0, -1),
        { ...activeStroke, points: [...activeStroke.points, point] },
      ];
    });
  };

  const finishStroke = (event: PointerEvent<SVGSVGElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointerId.current = null;
  };

  return (
    <section className={styles.screen} aria-labelledby="drawing-title">
      <div className={styles.header}>
        <p className={styles.label}>選択中のモード</p>
        <h1 id="drawing-title" className={styles.title}>
          {modeLabels[mode]}
        </h1>
        <p className={styles.instructions}>マウスや指でドラッグして描いてみよう</p>
      </div>
      <div className={styles.drawingArea}>
        <svg
          className={styles.canvas}
          viewBox={`0 0 ${DRAWING_WIDTH} ${DRAWING_HEIGHT}`}
          role="img"
          aria-label={`${modeLabels[mode]}の描画エリア`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        >
          {strokes.map((stroke) => (
            <polyline
              key={stroke.id}
              points={stroke.points.map(({ x, y }) => `${x},${y}`).join(' ')}
              fill="none"
              stroke="#1f2937"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
