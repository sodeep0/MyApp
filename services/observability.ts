/**
 * Thin observability wrapper. Uses Sentry when EXPO_PUBLIC_SENTRY_DSN is set;
 * otherwise logs to console so local/dev builds stay zero-config.
 */

type Severity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

let sentryInitialized = false;
let sentryModule: typeof import('@sentry/react-native') | null = null;

function getDsn(): string | undefined {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  return typeof dsn === 'string' && dsn.trim().length > 0 ? dsn.trim() : undefined;
}

export async function initObservability(): Promise<void> {
  if (sentryInitialized) return;

  const dsn = getDsn();
  if (!dsn) {
    return;
  }

  try {
    sentryModule = await import('@sentry/react-native');
    sentryModule.init({
      dsn,
      debug: __DEV__,
      tracesSampleRate: __DEV__ ? 1.0 : 0.15,
    });
    sentryInitialized = true;
  } catch (error) {
    console.warn('[observability] Sentry init failed; falling back to console.', error);
    sentryModule = null;
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));

  if (sentryModule && sentryInitialized) {
    sentryModule.captureException(err, context ? { extra: context } : undefined);
    return;
  }

  console.error('[observability]', err.message, context ?? '');
}

export function captureMessage(
  message: string,
  level: Severity = 'warning',
  context?: Record<string, unknown>,
): void {
  if (sentryModule && sentryInitialized) {
    sentryModule.captureMessage(message, {
      level,
      extra: context,
    });
    return;
  }

  const log =
    level === 'error' || level === 'fatal'
      ? console.error
      : level === 'warning'
        ? console.warn
        : console.info;
  log(`[observability] ${message}`, context ?? '');
}

export function isObservabilityEnabled(): boolean {
  return sentryInitialized && Boolean(getDsn());
}
