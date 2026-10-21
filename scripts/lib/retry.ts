/**
 * 指數退避重試。預設 3 次（含第一次），延遲 base、2×base、直到上限。
 * RSS、iTunes lookup、音檔／封面下載共用，避免一次網路閃斷就讓整輪 sync 失敗。
 */

export type RetryInfo = {
  attempt: number;
  tries: number;
  delayMs: number;
  error: unknown;
};

export type RetryOptions = {
  /** 含第一次，預設 3。 */
  tries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
  sleep?: (ms: number) => Promise<void>;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (info: RetryInfo) => void;
};

const DEFAULT_TRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 8_000;

export function retryDelayMs(
  attempt: number,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
): number {
  const exponent = Math.max(0, attempt - 1);
  return Math.min(baseDelayMs * 2 ** exponent, maxDelayMs);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const tries = options.tries ?? DEFAULT_TRIES;
  if (!Number.isInteger(tries) || tries < 1) {
    throw new Error(`withRetry tries 必須是正整數，收到 ${tries}`);
  }
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;

  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = options.shouldRetry ? options.shouldRetry(error) : true;
      if (!retryable || attempt === tries) break;
      const delayMs = retryDelayMs(attempt, baseDelayMs, maxDelayMs);
      const info: RetryInfo = { attempt, tries, delayMs, error };
      if (options.onRetry) {
        options.onRetry(info);
      } else if (options.label) {
        console.warn(
          `[retry] ${options.label} 第 ${attempt}/${tries} 次失敗，${delayMs}ms 後重試：${errorMessage(error)}`,
        );
      }
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/** 檔案過大不會因為重試變小，直接放棄。 */
export function isOversizedDownloadError(error: unknown): boolean {
  return /too large/i.test(errorMessage(error));
}
