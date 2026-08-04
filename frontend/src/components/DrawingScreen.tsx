import { useMemo, useRef, useState } from 'react';
import type { DrawMode } from 'shared';
import styles from './DrawingScreen.module.css';

type DrawingScreenProps = {
  mode: DrawMode;
  onComplete: (imageData: string) => void;
};

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  points: Point[];
  color: string;
  width: number;
};

const modeLabels: Record<DrawMode, string> = {
  free: '自由にお絵かき',
  coloring: 'イニャーの塗り絵',
};

const palette = ['#14201d', '#ef4e4e', '#f29f05', '#2f9e44', '#1c7ed6', '#845ef7', '#ffffff'];
const drawingSize = {
  width: 720,
  height: 460,
};

function toPath(points: Point[]) {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

function createColoringTemplate() {
  return `
    <g fill="none" stroke="#52635f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M220 245 C200 150 270 95 360 115 C450 95 520 150 500 245 C530 305 485 380 390 370 C370 410 325 410 305 370 C210 380 165 305 220 245 Z" />
      <path d="M282 118 L252 65 L330 105" />
      <path d="M438 118 L468 65 L390 105" />
      <path d="M302 235 L302 235" />
      <path d="M418 235 L418 235" />
      <path d="M335 275 C350 288 370 288 385 275" />
      <path d="M255 278 C220 268 195 258 170 240" />
      <path d="M465 278 C500 268 525 258 550 240" />
    </g>
  `;
}

function createSvgDocument(mode: DrawMode, strokes: Stroke[]) {
  const template = mode === 'coloring' ? createColoringTemplate() : '';
  const strokeMarkup = strokes
    .map(
      (stroke) =>
        `<path d="${toPath(stroke.points)}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round" />`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${drawingSize.width} ${drawingSize.height}">
    <rect width="100%" height="100%" fill="#ffffff" />
    ${template}
    ${strokeMarkup}
  </svg>`;
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function DrawingScreen({ mode, onComplete }: DrawingScreenProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const activeStrokeId = useRef<string | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState(palette[0]);
  const [width, setWidth] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  const svgMarkup = useMemo(() => createSvgDocument(mode, strokes), [mode, strokes]);

  const getPoint = (event: React.PointerEvent<SVGSVGElement>): Point | null => {
    const svg = svgRef.current;
    if (svg === null) {
      return null;
    }

    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * drawingSize.width,
      y: ((event.clientY - rect.top) / rect.height) * drawingSize.height,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = getPoint(event);
    if (point === null) {
      return;
    }

    const nextStroke: Stroke = {
      id: crypto.randomUUID(),
      points: [point],
      color: isEraser ? '#ffffff' : color,
      width: isEraser ? 28 : width,
    };

    activeStrokeId.current = nextStroke.id;
    event.currentTarget.setPointerCapture(event.pointerId);
    setStrokes((current) => [...current, nextStroke]);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = getPoint(event);
    const strokeId = activeStrokeId.current;
    if (point === null || strokeId === null) {
      return;
    }

    setStrokes((current) =>
      current.map((stroke) =>
        stroke.id === strokeId ? { ...stroke, points: [...stroke.points, point] } : stroke,
      ),
    );
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    activeStrokeId.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section className={styles.screen} aria-labelledby="drawing-title">
      <div className={styles.header}>
        <div>
          <p className={styles.label}>選択中のモード</p>
          <h1 id="drawing-title" className={styles.title}>
            {modeLabels[mode]}
          </h1>
        </div>
        <button
          type="button"
          className={styles.nextButton}
          onClick={() => onComplete(toDataUrl(svgMarkup))}
        >
          次へ
        </button>
      </div>

      <div className={styles.workspace}>
        <div className={styles.tools} aria-label="描画ツール">
          <div className={styles.toolGroup}>
            {palette.map((paletteColor) => (
              <button
                key={paletteColor}
                type="button"
                className={`${styles.swatch} ${color === paletteColor && !isEraser ? styles.activeSwatch : ''}`}
                style={{ background: paletteColor }}
                aria-label={`色 ${paletteColor}`}
                onClick={() => {
                  setColor(paletteColor);
                  setIsEraser(false);
                }}
              />
            ))}
          </div>
          <label className={styles.sliderLabel}>
            太さ
            <input
              min="3"
              max="22"
              type="range"
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className={`${styles.toolButton} ${isEraser ? styles.activeTool : ''}`}
            onClick={() => setIsEraser((current) => !current)}
          >
            消しゴム
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => setStrokes((current) => current.slice(0, -1))}
          >
            Undo
          </button>
          <button type="button" className={styles.toolButton} onClick={() => setStrokes([])}>
            Clear
          </button>
        </div>

        <svg
          ref={svgRef}
          className={styles.canvas}
          viewBox={`0 0 ${drawingSize.width} ${drawingSize.height}`}
          role="img"
          aria-label={`${modeLabels[mode]}の描画エリア`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <rect width="100%" height="100%" fill="#ffffff" />
          {mode === 'coloring' ? (
            <g
              fill="none"
              stroke="#52635f"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M220 245 C200 150 270 95 360 115 C450 95 520 150 500 245 C530 305 485 380 390 370 C370 410 325 410 305 370 C210 380 165 305 220 245 Z" />
              <path d="M282 118 L252 65 L330 105" />
              <path d="M438 118 L468 65 L390 105" />
              <path d="M302 235 L302 235" />
              <path d="M418 235 L418 235" />
              <path d="M335 275 C350 288 370 288 385 275" />
              <path d="M255 278 C220 268 195 258 170 240" />
              <path d="M465 278 C500 268 525 258 550 240" />
            </g>
          ) : null}
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={toPath(stroke.points)}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
