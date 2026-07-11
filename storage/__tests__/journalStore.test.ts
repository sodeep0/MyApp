import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { normalizeJournalEntries, normalizeJournalEntry } from '../../stores/journalEntryNormalization';
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
  assert.match(source, /normalizeJournalEntry\(merged\)/);
});

test('journal normalization enforces mood, content, and tag bounds', () => {
  const valid = normalizeJournalEntry({
    ...journalEntry('bound', '2026-05-10'),
    moodScore: 5.4,
    contentJson: 'x'.repeat(25_000),
    tags: Array.from({ length: 25 }, (_, i) => `tag-${i}-${'y'.repeat(50)}`),
  });

  assert.ok(valid);
  assert.equal(valid!.moodScore, 5);
  assert.equal(valid!.contentJson.length, 20_000);
  assert.equal(valid!.tags.length, 20);
  assert.ok(valid!.tags.every((tag) => tag.length <= 40));

  assert.equal(normalizeJournalEntry({ id: '', date: '2026-05-10', moodScore: 3 }), null);
  assert.equal(normalizeJournalEntry({ id: 'x', date: 'not-a-date', moodScore: 3 }), null);
  assert.equal(normalizeJournalEntry({ id: 'x', date: '2026-05-10', moodScore: 9 }), null);
});
