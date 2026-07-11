import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, test } from 'node:test';

import { getSyncDropStats } from '../../services/sync/syncQueue';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

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

beforeEach(() => {
  installLocalStorage();
});

test('data export service still exposes buildExportPayload for runtime use', () => {
  const source = readProjectFile('services/dataExport.ts');
  assert.match(source, /export async function buildExportPayload/);
  assert.match(source, /journalEntries/);
  assert.match(source, /badHabits/);
});

test('local reset service still exposes resetLocalAppData for runtime use', () => {
  const source = readProjectFile('services/dataManagement.ts');
  assert.match(source, /export async function resetLocalAppData/);
  assert.match(source, /resetSensitiveDataStorage/);
});

test('getSyncDropStats defaults to empty telemetry', async () => {
  const stats = await getSyncDropStats();
  assert.equal(stats.count, 0);
  assert.equal(stats.lastDroppedAt, null);
});

test('secure data storage fails closed instead of Math.random key fallback', () => {
  const source = readProjectFile('storage/secureDataStorage.ts');
  assert.doesNotMatch(source, /Falling back to Math\.random/);
  assert.match(source, /Refusing to store encryption keys in AsyncStorage/);
  assert.match(source, /not supported on web/);
});
