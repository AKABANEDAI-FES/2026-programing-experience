import { useEffect } from 'react';
import styles from './CompleteScreen.module.css';

type CompleteScreenProps = {
  onDone: () => void;
};

export function CompleteScreen({ onDone }: CompleteScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 5000);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  return (
    <section className={styles.screen} aria-labelledby="complete-title">
      <div className={styles.panel}>
        <p className={styles.label}>放流完了</p>
        <h1 id="complete-title" className={styles.title}>
          海へ送りました
        </h1>
        <p className={styles.message}>まもなく最初の画面に戻ります。</p>
      </div>
    </section>
  );
}
