import styles from './DisplayPage.module.css';

export function DisplayPage() {
  return (
    <main className={styles.page} aria-label="大画面モニター">
      <p className={styles.placeholder}>水槽画面（仮）</p>
    </main>
  );
}
