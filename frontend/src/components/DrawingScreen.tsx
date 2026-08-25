import type { DrawMode } from 'shared';
import inyaaOutline from '../assets/inyaa-outline.svg';
import { DRAW_MODES, DRAW_MODE_COPY } from '../constants/drawModes';
import styles from './DrawingScreen.module.css';

type DrawingScreenProps = {
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
};

export function DrawingScreen({ mode, onModeChange }: DrawingScreenProps) {
  const copy = DRAW_MODE_COPY[mode];

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

      <div className={styles.drawingArea} aria-label={`${copy.label}の描画エリア`}>
        {mode === 'coloring' && <img className={styles.outline} src={inyaaOutline} alt="" />}
        <p className={styles.drawingHint}>{copy.drawingHint}</p>
      </div>
    </section>
  );
}
