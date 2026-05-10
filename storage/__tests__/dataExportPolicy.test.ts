import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

test('data export service documents sensitive local-only data as explicit export-only content', () => {
  const source = readProjectFile('services/dataExport.ts');

  assert.match(source, /journal: 'included from local-only device storage'/);
  assert.match(source, /badHabits: 'included from local-only device storage'/);
  assert.match(source, /screenTime: 'included from local device settings'/);
  assert.match(source, /warnings: string\[\]/);
  assert.match(source, /cloudEligibleModules: \['profile', 'habits', 'goals', 'activities'\]/);
  assert.match(source, /getAllJournalEntries/);
  assert.match(source, /getAllBadHabits/);
  assert.match(source, /getAllUrgeEvents/);
  assert.match(source, /getScreenTimeExportState/);
});

test('data export service does not import Firebase or write to storage', () => {
  const source = readProjectFile('services/dataExport.ts');
  const imports = source
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith('import '))
    .join('\n');

  assert.doesNotMatch(imports, /firebase/i);
  assert.doesNotMatch(source, /setItem\(/);
  assert.doesNotMatch(source, /save[A-Za-z]+\(/);
});

test('data export tolerates per-habit completion failures with explicit warnings', () => {
  const source = readProjectFile('services/dataExport.ts');

  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /Habit completions for \$\{habitId\} could not be included/);
  assert.doesNotMatch(source, /Promise\.all\(\s*habits\.map/);
});

test('data export screen delegates payload assembly to the data export service', () => {
  const source = readProjectFile('app/profile/data-export.tsx');

  assert.match(source, /buildExportPayload/);
  assert.match(source, /payload\.warnings\.length > 0/);
  assert.match(source, /Kaarma export warnings/);
  assert.match(source, /screen-time settings/);
  assert.match(source, /prepared locally and shared as JSON/);
  assert.doesNotMatch(source, /getAllJournalEntries/);
  assert.doesNotMatch(source, /getAllBadHabits/);
  assert.doesNotMatch(source, /getAllUrgeEvents/);
});
