import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

function importStatements(source: string): string {
  return source
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('import '))
    .join('\n');
}

test('journal store remains local-only and does not import Firebase or repositories', () => {
  const source = readProjectFile('stores/journalStore.ts');
  const imports = importStatements(source);

  assert.doesNotMatch(imports, /firebase/i);
  assert.doesNotMatch(imports, /repositories\//);
  assert.doesNotMatch(imports, /get[A-Za-z]+Repository/);
  assert.doesNotMatch(source, /get[A-Za-z]+Repository\(/);
  assert.match(source, /getSensitiveItem/);
  assert.match(source, /setSensitiveItem/);
});

test('journal entry creation enforces the shared free-tier gate before saving', () => {
  const source = readProjectFile('stores/journalStore.ts');

  assert.match(source, /enforceCountLimitedFeatureGate\('journalEntries', countJournalEntries\)/);
  assert.match(source, /export function countJournalEntries\(\): Promise<number>/);
  assert.match(source, /return getAllJournalEntries\(\)\.then\(\(entries\) => entries\.length\)/);
});

test('bad-habit store remains local-only and does not import Firebase or repositories', () => {
  const source = readProjectFile('stores/badHabitStore.ts');
  const imports = importStatements(source);

  assert.doesNotMatch(imports, /firebase/i);
  assert.doesNotMatch(imports, /repositories\//);
  assert.doesNotMatch(imports, /get[A-Za-z]+Repository/);
  assert.doesNotMatch(source, /get[A-Za-z]+Repository\(/);
  assert.match(source, /getSensitiveItem/);
  assert.match(source, /setSensitiveItem/);
});

test('bad-habit creation enforces the shared free-tier gate before saving', () => {
  const source = readProjectFile('stores/badHabitStore.ts');

  assert.match(source, /enforceCountLimitedFeatureGate\('badHabits', countActiveBadHabits\)/);
  assert.match(source, /export function countActiveBadHabits\(\): Promise<number>/);
  assert.match(source, /return getAllBadHabits\(\)\.then\(\(habits\) => habits\.length\)/);
});

test('repository factory exposes only cloud-eligible module repositories', () => {
  const source = readProjectFile('repositories/factory.ts');

  assert.match(source, /getUserRepository/);
  assert.match(source, /getHabitRepository/);
  assert.match(source, /getGoalRepository/);
  assert.match(source, /getActivityRepository/);
  assert.doesNotMatch(source, /getJournalRepository/);
  assert.doesNotMatch(source, /getBadHabitRepository/);
});

test('habit store exposes a domain helper for premium-aware visible history', () => {
  const source = readProjectFile('stores/habitStore.ts');

  assert.match(source, /filterHabitHistoryCompletions/);
  assert.match(source, /getStoredPremiumState/);
  assert.match(source, /export async function getVisibleCompletionsForHabit/);
});

test('habit detail calendar uses the store-provided premium-aware visible history', () => {
  const source = readProjectFile('app/(tabs)/habits/detail.tsx');

  assert.match(source, /getVisibleCompletionsForHabit/);
  assert.match(source, /setVisibleCompletions\(visibleComps\)/);
  assert.match(source, /getMonthlyCalendar\(visibleCompletions, calendarStartDate, calendarMonth\)/);
  assert.doesNotMatch(source, /const calendarCompletions = isPremium/);
});
