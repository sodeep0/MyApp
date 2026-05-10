import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { normalizeJournalEntries } from '../../stores/journalEntryNormalization';
import type { JournalEntry } from '../../types/models';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

function journalEntry(id: string, date: string): JournalEntry {
  return {
    id,
    userId: 'local',
    date,
    moodScore: 4,
    contentJson: '',
    tags: [],
    photoUris: [],
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
  };
}

test('journal reads ignore malformed persisted entries before sorting and filtering', async () => {
  const entries = normalizeJournalEntries([
    journalEntry('earlier', '2026-05-08'),
    null,
    { id: 'missing-date' },
    { id: 42, date: '2026-05-10' },
    journalEntry('later', '2026-05-10'),
  ]).sort((a, b) => b.date.localeCompare(a.date));

  assert.deepEqual(
    entries.map((entry) => entry.id),
    ['later', 'earlier'],
  );
  assert.deepEqual(
    entries.filter((entry) => entry.date.startsWith('2026-05-10')).map((entry) => entry.id),
    ['later'],
  );
});

test('journal reads treat non-array persisted values as empty', () => {
  assert.deepEqual(normalizeJournalEntries({ id: 'not-an-array', date: '2026-05-10' }), []);
});

test('journal writes normalize entries before sensitive local persistence', () => {
  const source = readProjectFile('stores/journalStore.ts');

  assert.match(source, /value: normalizeJournalEntries\(entries\)/);
});
