import styles from './ProgrammingScreen.module.css';

type ProgrammingScreenProps = {
  imageData: string;
  onBack: () => void;
};

export function ProgrammingScreen({ imageData, onBack }: ProgrammingScreenProps) {
  return (
    <section className={styles.screen} aria-labelledby="programming-title">
      <div className={styles.header}>
        <p className={styles.label}>プログラミングモード</p>
        <h1 id="programming-title" className={styles.title}>
          画像を動かそう
        </h1>
        <p className={styles.description}>この画像がプログラミングの対象になります。</p>
      </div>

      <div className={styles.workspace}>
        <div className={styles.stage} aria-label="プログラミング対象の画像">
          <img className={styles.targetImage} src={imageData} alt="プログラミング対象の作品" />
        </div>
        <div className={styles.editorPlaceholder}>
          <p>ここにスクラッチ用のエディタを実装</p>
        </div>
      </div>

      <button type="button" className={styles.backButton} onClick={onBack}>
        お絵かきに戻る
      </button>
    </section>
  );
}
