import { storage } from '@/storage/asyncStorage';
import { generateUUID } from '@/utils/id';

const SYNC_QUEUE_KEY = 'kaarma_sync_queue_v1';
const SYNC_DROP_STATS_KEY = 'kaarma_sync_drop_stats_v1';
const MAX_ATTEMPTS = 5;

export type SyncModule = 'user' | 'habits' | 'goals' | 'activities';

export type SyncDropStats = {
  count: number;
  lastDroppedAt: string | null;
  lastModule: SyncModule | null;
  lastAction: string | null;
};

export class PermanentSyncItemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentSyncItemError';
  }
}

export interface SyncQueueItem {
  id: string;
  module: SyncModule;
  action: string;
  payload: unknown;
  attempts: number;
  createdAt: string;
  lastError: string | null;
}

function isSyncModule(value: unknown): value is SyncModule {
  return value === 'user' || value === 'habits' || value === 'goals' || value === 'activities';
}

function normalizeQueueItem(item: unknown): SyncQueueItem | null {
  if (!item || typeof item !== 'object') return null;

  const candidate = item as Partial<SyncQueueItem>;
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return null;
  if (!isSyncModule(candidate.module)) return null;
  if (typeof candidate.action !== 'string' || candidate.action.trim().length === 0) return null;

  return {
    id: candidate.id,
    module: candidate.module,
    action: candidate.action.trim(),
    payload: candidate.payload,
    attempts:
      typeof candidate.attempts === 'number' && Number.isFinite(candidate.attempts) && candidate.attempts >= 0
        ? Math.floor(candidate.attempts)
        : 0,
    createdAt:
      typeof candidate.createdAt === 'string' && candidate.createdAt.length > 0
        ? candidate.createdAt
        : new Date().toISOString(),
    lastError:
      typeof candidate.lastError === 'string'
        ? candidate.lastError
        : null,
  };
}

function normalizeSyncAction(action: string): string {
  const normalizedAction = action.trim();
  if (normalizedAction.length === 0) {
    throw new Error('Sync queue action must not be empty.');
  }
  return normalizedAction;
}

function normalizeSyncModule(module: SyncModule): SyncModule {
  if (!isSyncModule(module)) {
    throw new Error('Sync queue module must be cloud-eligible.');
  }
  return module;
}

function getSyncErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isPermanentSyncItemError(error: unknown): error is PermanentSyncItemError {
  return error instanceof PermanentSyncItemError;
}

async function getQueue(): Promise<SyncQueueItem[]> {
  const stored = await storage.getItem<unknown>(SYNC_QUEUE_KEY, null);
  if (!Array.isArray(stored)) return [];
  return stored
    .map(normalizeQueueItem)
    .filter((item): item is SyncQueueItem => item !== null);
}

async function saveQueue(items: SyncQueueItem[]): Promise<void> {
  await storage.setItem(SYNC_QUEUE_KEY, items);
}

export async function getSyncDropStats(): Promise<SyncDropStats> {
  const stored = await storage.getItem<Partial<SyncDropStats> | null>(SYNC_DROP_STATS_KEY, null);
  return {
    count: typeof stored?.count === 'number' && Number.isFinite(stored.count) ? stored.count : 0,
    lastDroppedAt: typeof stored?.lastDroppedAt === 'string' ? stored.lastDroppedAt : null,
    lastModule: isSyncModule(stored?.lastModule) ? stored.lastModule : null,
    lastAction: typeof stored?.lastAction === 'string' ? stored.lastAction : null,
  };
}

async function recordSyncDrop(item: SyncQueueItem, reason: string): Promise<void> {
  const previous = await getSyncDropStats();
  const next: SyncDropStats = {
    count: previous.count + 1,
    lastDroppedAt: new Date().toISOString(),
    lastModule: item.module,
    lastAction: item.action,
  };
  await storage.setItem(SYNC_DROP_STATS_KEY, next);
  console.warn(
    `[sync] dropped ${item.module}:${item.action} (${reason}). totalDrops=${next.count}`,
  );
}

export async function clearSyncQueue(modules?: SyncModule[]): Promise<void> {
  if (!modules || modules.length === 0) {
    await storage.removeItem(SYNC_QUEUE_KEY);
    return;
  }

  const scopedModules = new Set(modules.map(normalizeSyncModule));
  const queue = await getQueue();
  await saveQueue(queue.filter((item) => !scopedModules.has(item.module)));
}

export async function enqueueSyncItem(
  module: SyncModule,
  action: string,
  payload: unknown,
): Promise<void> {
  const normalizedModule = normalizeSyncModule(module);
  const normalizedAction = normalizeSyncAction(action);
  const queue = await getQueue();
  queue.push({
    id: generateUUID(),
    module: normalizedModule,
    action: normalizedAction,
    payload,
    attempts: 0,
    createdAt: new Date().toISOString(),
    lastError: null,
  });
  await saveQueue(queue);
}

export async function flushSyncQueue(
  module: SyncModule,
  processor: (item: SyncQueueItem) => Promise<void>,
): Promise<void> {
  const normalizedModule = normalizeSyncModule(module);
  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining: SyncQueueItem[] = [];
  for (const item of queue) {
    if (item.module !== normalizedModule) {
      remaining.push(item);
      continue;
    }

    try {
      await processor(item);
      console.info(`[sync] flushed ${item.module}:${item.action}`);
    } catch (error) {
      const attempts = item.attempts + 1;
      const lastError = getSyncErrorMessage(error);
      if (isPermanentSyncItemError(error)) {
        await recordSyncDrop(item, `invalid: ${lastError}`);
      } else if (attempts >= MAX_ATTEMPTS) {
        await recordSyncDrop(item, `after ${attempts} attempts: ${lastError}`);
      } else {
        remaining.push({
          ...item,
          attempts,
          lastError,
        });
      }
    }
  }

  await saveQueue(remaining);
}
