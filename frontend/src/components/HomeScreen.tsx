import type { DrawMode } from 'shared';
import styles from './HomeScreen.module.css';

type HomeScreenProps = {
  onSelectMode: (mode: DrawMode) => void;
};

const modeOptions: Array<{
  mode: DrawMode;
  title: string;
  description: string;
}> = [
  {
    mode: 'free',
    title: '自由にお絵かき',
    description: '白紙からキャラクターを描きます。',
  },
  {
    mode: 'coloring',
    title: 'イニャーの塗り絵',
    description: '下絵に色を塗ってキャラクターを作ります。',
  },
];

export function HomeScreen({ onSelectMode }: HomeScreenProps) {
  return (
    <section className={styles.screen} aria-labelledby="home-title">
      <div className={styles.content}>
        <p className={styles.label}>プログラミング体験会</p>
        <h1 id="home-title" className={styles.title}>
          モードを選んでください
        </h1>
        <div className={styles.actions}>
          {modeOptions.map((option) => (
            <button
              key={option.mode}
              type="button"
              className={styles.modeButton}
              onClick={() => onSelectMode(option.mode)}
            >
              <span className={styles.modeTitle}>{option.title}</span>
              <span className={styles.modeDescription}>{option.description}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
