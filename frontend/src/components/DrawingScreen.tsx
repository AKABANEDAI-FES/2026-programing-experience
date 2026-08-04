import type { DrawMode } from 'shared';
import styles from './DrawingScreen.module.css';

type DrawingScreenProps = {
  mode: DrawMode;
};

const modeLabels: Record<DrawMode, string> = {
  free: '自由にお絵かき',
  coloring: 'イニャーの塗り絵',
};

export function DrawingScreen({ mode }: DrawingScreenProps) {
  return (
    <section className={styles.screen} aria-labelledby="drawing-title">
      <div className={styles.header}>
        <p className={styles.label}>選択中のモード</p>
        <h1 id="drawing-title" className={styles.title}>
          {modeLabels[mode]}
        </h1>
      </div>
      <div className={styles.placeholder} aria-label={`${modeLabels[mode]}の描画エリア`}>
        <p>
          {mode === 'free'
            ? '白紙キャンバスをここに実装します。'
            : '塗り絵の下絵をここに実装します。'}
        </p>
      </div>
    </section>
  );
}
