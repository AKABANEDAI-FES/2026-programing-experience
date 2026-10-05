import type { ReleaseResponse } from 'shared';

export const RELEASE_TOKEN_STORAGE_KEY = 'programming-experience-release-token';

type StorageReader = Pick<Storage, 'getItem'>;

export const getReleaseAuthorizationHeader = (storage: StorageReader): string | null => {
  try {
    const token = storage.getItem(RELEASE_TOKEN_STORAGE_KEY)?.trim();

    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
};

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
