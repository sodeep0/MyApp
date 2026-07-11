import { PermanentSyncItemError } from '@/services/sync/syncQueue';

/**
 * Fire-and-forget async work used by Firebase repository background sync.
 */
export function runInBackground(
  task: () => Promise<void>,
  label = 'Background sync task failed.',
): void {
  void task().catch((error) => {
    console.warn(label, error);
  });
}

/**
 * Validate a queued string id payload from the sync queue.
 */
export function requireQueuedId(payload: unknown, label: string): string {
  if (typeof payload !== 'string' || payload.trim().length === 0) {
    throw new PermanentSyncItemError(`queued ${label} id is invalid`);
  }
  return payload.trim();
}

/**
 * Single-flight guard for background cloud refresh pulls.
 */
export function createRefreshGuard(label: string): {
  run(task: () => Promise<void>): void;
} {
  let isRefreshing = false;

  return {
    run(task: () => Promise<void>): void {
      if (isRefreshing) return;
      isRefreshing = true;

      runInBackground(async () => {
        try {
          await task();
        } finally {
          isRefreshing = false;
        }
      }, label);
    },
  };
}
