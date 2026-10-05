import { useCallback, useRef, useState } from 'react';
import { MAX_COMMANDS, type Command, type ReleaseRequest, type ReleaseResponse } from 'shared';
import {
  getReleaseAuthorizationHeader,
  prepareSubmissionAttempt,
  shouldRecoverIdempotencyKey,
  type SubmissionAttempt,
} from '../lib/release-submission';
import { BlockWorkspace } from './BlockWorkspace';
import styles from './ProgrammingScreen.module.css';

type ProgrammingScreenProps = {
  imageData: string;
  onReleaseComplete: () => void;
};

type ReleaseState = 'idle' | 'sending' | 'processing' | 'unknown' | 'error';

const PROCESSING_MESSAGE = '送信処理中です。少し待ってから、同じ内容で状況を確認してください。';
const UNKNOWN_MESSAGE =
  '保存状況を確認できませんでした。同じ内容のまま、もう一度確認してください。';
const DEFAULT_ERROR_MESSAGE =
  '作品を送信できませんでした。内容を確認して、もう一度試してください。';

export function ProgrammingScreen({ imageData, onReleaseComplete }: ProgrammingScreenProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [releaseState, setReleaseState] = useState<ReleaseState>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const attemptRef = useRef<SubmissionAttempt | null>(null);
  const requestInFlightRef = useRef(false);

  const handleCommandsChange = useCallback((nextCommands: Command[]) => {
    setCommands(nextCommands);
    setReleaseState('idle');
    setFeedbackMessage(null);
  }, []);

  const sendSubmission = async (attempt: SubmissionAttempt, keyRecoveryCount = 0) => {
    const authorization = getReleaseAuthorizationHeader(window.localStorage);

    if (authorization === null) {
      setReleaseState('error');
      setFeedbackMessage('この端末は放流用に設定されていません。スタッフに知らせてください。');
      return;
    }

    setReleaseState('sending');
    setFeedbackMessage('作品を保存しています…');

    let response: Response;
    let result: ReleaseResponse;

    try {
      response = await fetch('/api/release', {
        method: 'POST',
        headers: {
          Authorization: authorization,
          'Content-Type': 'application/json',
          'Idempotency-Key': attempt.key,
        },
        body: attempt.body,
      });
      const responseBody: unknown = await response.json();

      if (typeof responseBody !== 'object' || responseBody === null) {
        throw new Error('APIから有効な応答を受け取れませんでした');
      }

      result = responseBody as ReleaseResponse;
    } catch {
      setReleaseState('unknown');
      setFeedbackMessage(UNKNOWN_MESSAGE);
      return;
    }

    if (shouldRecoverIdempotencyKey(result, keyRecoveryCount)) {
      const recoveredAttempt = { ...attempt, key: crypto.randomUUID() };
      attemptRef.current = recoveredAttempt;
      await sendSubmission(recoveredAttempt, keyRecoveryCount + 1);
      return;
    }

    if (!result.success && result.code === 'REQUEST_IN_PROGRESS') {
      setReleaseState('processing');
      setFeedbackMessage(PROCESSING_MESSAGE);
      return;
    }

    if (!result.success && result.code === 'RELEASE_STATUS_UNKNOWN') {
      setReleaseState('unknown');
      setFeedbackMessage(result.message || UNKNOWN_MESSAGE);
      return;
    }

    if (!response.ok || !result.success) {
      setReleaseState('error');
      setFeedbackMessage(result.message || DEFAULT_ERROR_MESSAGE);
      return;
    }

    onReleaseComplete();
  };

  const handleRelease = async () => {
    if (requestInFlightRef.current || releaseState === 'sending') {
      return;
    }

    requestInFlightRef.current = true;

    try {
      const request: ReleaseRequest = {
        image_base64: imageData,
        commands,
      };
      const body = JSON.stringify(request);
      const attempt = prepareSubmissionAttempt(body, attemptRef.current);

      attemptRef.current = attempt;
      await sendSubmission(attempt);
    } catch {
      setReleaseState('error');
      setFeedbackMessage('送信キーを作成できませんでした。ページを再読み込みしてください。');
    } finally {
      requestInFlightRef.current = false;
    }
  };

  const isSubmissionUnresolved =
    releaseState === 'sending' || releaseState === 'processing' || releaseState === 'unknown';

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
          <div className={styles.emptyProgramHint}>ブロックを置かなくても放流できます。</div>
          <div className={styles.editorContainer} inert={isSubmissionUnresolved}>
            <BlockWorkspace onCommandsChange={handleCommandsChange} />
          </div>
        </div>
      </div>
      {feedbackMessage !== null && (
        <p
          className={releaseState === 'error' ? styles.errorMessage : styles.statusMessage}
          role={releaseState === 'error' ? 'alert' : 'status'}
          aria-live={releaseState === 'error' ? 'assertive' : 'polite'}
        >
          {feedbackMessage}
        </p>
      )}
      <button
        type="button"
        className={styles.releaseButton}
        onClick={handleRelease}
        disabled={releaseState === 'sending'}
      >
        {releaseState === 'sending'
          ? '保存中…'
          : releaseState === 'processing' || releaseState === 'unknown'
            ? '送信状況を確認'
            : releaseState === 'error'
              ? 'もう一度放流'
              : '放流する'}
      </button>
    </section>
  );
}
