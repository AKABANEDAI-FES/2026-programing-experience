import { useCallback, useState } from 'react';
import { MAX_COMMANDS, type Command } from 'shared';
import { BlockWorkspace } from './BlockWorkspace';
import styles from './ProgrammingScreen.module.css';

type ProgrammingScreenProps = {
  imageData: string;
};

export function ProgrammingScreen({ imageData }: ProgrammingScreenProps) {
  const [commands, setCommands] = useState<Command[]>([]);

  const handleCommandsChange = useCallback((nextCommands: Command[]) => {
    setCommands(nextCommands);
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
        <div className={styles.editor}>
          <p className={styles.counter} aria-live="polite">
            つかったブロック {commands.length} / {MAX_COMMANDS}
          </p>
          <div className={styles.editorContainer}>
            <BlockWorkspace onCommandsChange={handleCommandsChange} />
          </div>
        </div>
      </div>
    </section>
  );
}
