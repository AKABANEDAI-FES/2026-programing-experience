import { useCallback, useRef } from 'react';
import { BlockWorkspace } from './BlockWorkspace';
import styles from './ProgrammingScreen.module.css';

type ProgrammingScreenProps = {
  imageData: string;
};

export function ProgrammingScreen({ imageData }: ProgrammingScreenProps) {
  const workspaceJsonRef = useRef<Record<string, unknown>>({});

  const handleWorkspaceChange = useCallback((json: Record<string, unknown>) => {
    workspaceJsonRef.current = json;
  }, []);

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
        <div className={styles.editorContainer}>
          <BlockWorkspace onWorkspaceChange={handleWorkspaceChange} />
        </div>
      </div>
    </section>
  );
}
