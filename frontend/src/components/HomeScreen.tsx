import type { DrawMode } from 'shared';
import { DRAW_MODES, DRAW_MODE_COPY } from '../constants/drawModes';
import styles from './HomeScreen.module.css';

type HomeScreenProps = {
  onSelectMode: (mode: DrawMode) => void;
};

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
  return (
    <section className={styles.screen} aria-labelledby="home-title">
      <div className={styles.content}>
        <p className={styles.label}>プログラミング体験会</p>
        <h1 id="home-title" className={styles.title}>
          モードを選んでください
        </h1>
        <div className={styles.actions}>
          {DRAW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={styles.modeButton}
              onClick={() => onSelectMode(mode)}
            >
              <span className={styles.modeTitle}>{DRAW_MODE_COPY[mode].label}</span>
              <span className={styles.modeDescription}>{DRAW_MODE_COPY[mode].homeDescription}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
