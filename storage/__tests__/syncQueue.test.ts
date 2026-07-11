import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { storage } from '../asyncStorage';
import {
  clearSyncQueue,
  enqueueSyncItem,
  flushSyncQueue,
  PermanentSyncItemError,
  type SyncQueueItem,
} from '../../services/sync/syncQueue';

const SYNC_QUEUE_KEY = 'kaarma_sync_queue_v1';

function installLocalStorage(): void {
  const values = new Map<string, string>();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
        removeItem: (key: string) => {
          values.delete(key);
        },
      },
    },
  });
}

async function readQueue(): Promise<SyncQueueItem[]> {
  return (await storage.getItem<SyncQueueItem[]>(SYNC_QUEUE_KEY)) ?? [];
}

beforeEach(() => {
  installLocalStorage();
});

test('enqueueSyncItem stores pending work with initial retry metadata', async () => {
  await enqueueSyncItem('goals', 'update', { id: 'goal-1' });

  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].module, 'goals');
  assert.equal(queue[0].action, 'update');
  assert.deepEqual(queue[0].payload, { id: 'goal-1' });
  assert.equal(queue[0].attempts, 0);
  assert.equal(queue[0].lastError, null);
});

test('enqueueSyncItem recovers when the stored queue is corrupted', async () => {
  await storage.setItem(SYNC_QUEUE_KEY, { not: 'a queue' });

  await enqueueSyncItem('goals', 'update', { id: 'goal-1' });

  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].module, 'goals');
});

test('enqueueSyncItem rejects empty action names before persisting', async () => {
  await assert.rejects(
    enqueueSyncItem('goals', '  ', { id: 'goal-1' }),
    /Sync queue action must not be empty/,
  );

  assert.deepEqual(await readQueue(), []);
});

test('enqueueSyncItem rejects local-only modules before persisting', async () => {
  await assert.rejects(
    enqueueSyncItem('journal' as any, 'create', { id: 'journal-1' }),
    /Sync queue module must be cloud-eligible/,
  );
  await assert.rejects(
    enqueueSyncItem('badHabits' as any, 'create', { id: 'bad-habit-1' }),
    /Sync queue module must be cloud-eligible/,
  );

  assert.deepEqual(await readQueue(), []);
});

test('flushSyncQueue rejects local-only modules before processing', async () => {
  await enqueueSyncItem('goals', 'update', { id: 'goal-1' });

  await assert.rejects(
    flushSyncQueue('journal' as any, async () => {
      throw new Error('processor should not run');
    }),
    /Sync queue module must be cloud-eligible/,
  );

  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].module, 'goals');
});

test('flushSyncQueue removes successfully processed items and preserves other modules', async () => {
  await enqueueSyncItem('goals', 'update', { id: 'goal-1' });
  await enqueueSyncItem('habits', 'update', { id: 'habit-1' });

  const processed: string[] = [];
  await flushSyncQueue('goals', async (item) => {
    processed.push(item.action);
  });

  assert.deepEqual(processed, ['update']);
  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].module, 'habits');
});

test('flushSyncQueue skips malformed queue items and normalizes retry metadata', async () => {
  await storage.setItem(SYNC_QUEUE_KEY, [
    { id: 'malformed-missing-module', action: 'update' },
    {
      id: 'queued-1',
      module: 'goals',
      action: ' update ',
      payload: { id: 'goal-1' },
      attempts: 1.8,
      createdAt: '',
      lastError: 12,
    },
  ]);

  const processed: SyncQueueItem[] = [];
  await flushSyncQueue('goals', async (item) => {
    processed.push(item);
  });

  assert.equal(processed.length, 1);
  assert.equal(processed[0].action, 'update');
  assert.equal(processed[0].attempts, 1);
  assert.equal(processed[0].lastError, null);
  assert.deepEqual(await readQueue(), []);
});

test('flushSyncQueue retries failed items and records the last error', async () => {
  await enqueueSyncItem('activities', 'create', { id: 'activity-1' });

  await flushSyncQueue('activities', async () => {
    throw new Error('network offline');
  });

  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].attempts, 1);
  assert.equal(queue[0].lastError, 'network offline');
});

test('flushSyncQueue drops an item after the maximum retry attempt', async () => {
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  await storage.setItem<SyncQueueItem[]>(SYNC_QUEUE_KEY, [
    {
      id: 'queued-1',
      module: 'user',
      action: 'update',
      payload: { id: 'user-1' },
      attempts: 4,
      createdAt: '2026-04-20T00:00:00.000Z',
      lastError: 'previous failure',
    },
  ]);

  try {
    await flushSyncQueue('user', async () => {
      throw new Error('still offline');
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(await readQueue(), []);
  assert.deepEqual(warnings, [
    ['[sync] dropped user:update (after 5 attempts: still offline). totalDrops=1'],
  ]);
});

test('flushSyncQueue drops permanent invalid items without retrying', async () => {
  const warnings: unknown[][] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  await enqueueSyncItem('goals', 'setGoal', { id: 42 });

  try {
    await flushSyncQueue('goals', async () => {
      throw new PermanentSyncItemError('queued goal payload is invalid');
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.deepEqual(await readQueue(), []);
  assert.deepEqual(warnings, [
    ['[sync] dropped goals:setGoal (invalid: queued goal payload is invalid). totalDrops=1'],
  ]);
});

test('clearSyncQueue removes only requested modules when scoped', async () => {
  await enqueueSyncItem('goals', 'update', { id: 'goal-1' });
  await enqueueSyncItem('activities', 'create', { id: 'activity-1' });

  await clearSyncQueue(['goals']);

  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].module, 'activities');
});

test('clearSyncQueue rejects local-only scoped modules before mutating the queue', async () => {
  await enqueueSyncItem('goals', 'update', { id: 'goal-1' });

  await assert.rejects(
    clearSyncQueue(['badHabits' as any]),
    /Sync queue module must be cloud-eligible/,
  );

  const queue = await readQueue();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].module, 'goals');
});
