import type { ReleaseResponse } from 'shared';

export type SubmissionAttempt = {
  key: string;
  body: string;
};

export const prepareSubmissionAttempt = (
  body: string,
  previousAttempt: SubmissionAttempt | null,
  createKey: () => string = () => crypto.randomUUID(),
): SubmissionAttempt =>
  previousAttempt?.body === body ? previousAttempt : { key: createKey(), body };

export const shouldRecoverIdempotencyKey = (
  result: ReleaseResponse,
  recoveryCount: number,
): boolean => !result.success && result.code === 'IDEMPOTENCY_KEY_REUSED' && recoveryCount === 0;
