import { storage } from '@/storage/asyncStorage';
import { generateUUID } from '@/stores/baseStore';

const SYNC_QUEUE_KEY = 'kaarma_sync_queue_v1';
const MAX_ATTEMPTS = 5;

export type SyncModule = 'user' | 'habits' | 'goals' | 'activities';

export interface SyncQueueItem {
  id: string;
  module: SyncModule;
  action: string;
  payload: unknown;
  attempts: number;
  createdAt: string;
  lastError: string | null;
}

async function getQueue(): Promise<SyncQueueItem[]> {
  return (await storage.getItem<SyncQueueItem[]>(SYNC_QUEUE_KEY)) ?? [];
}

async function saveQueue(items: SyncQueueItem[]): Promise<void> {
  await storage.setItem(SYNC_QUEUE_KEY, items);
}

export async function clearSyncQueue(modules?: SyncModule[]): Promise<void> {
  if (!modules || modules.length === 0) {
    await storage.removeItem(SYNC_QUEUE_KEY);
    return;
  }

  const scopedModules = new Set(modules);
  const queue = await getQueue();
  await saveQueue(queue.filter((item) => !scopedModules.has(item.module)));
}

export async function enqueueSyncItem(
  module: SyncModule,
  action: string,
  payload: unknown,
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: generateUUID(),
    module,
    action,
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
  const queue = await getQueue();
  if (queue.length === 0) return;

  const remaining: SyncQueueItem[] = [];
  for (const item of queue) {
    if (item.module !== module) {
      remaining.push(item);
      continue;
    }

    try {
      await processor(item);
      console.info(`[sync] flushed ${item.module}:${item.action}`);
    } catch (error) {
      const attempts = item.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        console.warn(`[sync] dropped ${item.module}:${item.action} after ${attempts} attempts`, error);
      } else {
        remaining.push({
          ...item,
          attempts,
          lastError: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await saveQueue(remaining);
}
