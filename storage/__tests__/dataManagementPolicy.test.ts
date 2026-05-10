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

test('local data reset clears sensitive data, cloud-backed caches, sync queue, and screen-time state', () => {
  const source = readProjectFile('services/dataManagement.ts');

  assert.match(source, /resetSensitiveDataStorage/);
  assert.match(source, /clearSyncQueue/);
  assert.match(source, /clearUserLocalSessionData/);
  assert.match(source, /clearHabitLocalCache/);
  assert.match(source, /clearGoalLocalCache/);
  assert.match(source, /clearActivityLocalCache/);
  assert.match(source, /resetScreenTimeData/);
  assert.match(source, /cancelManagedNotificationsAsync/);
});

test('local data reset stays local-only and does not perform Firebase account or cloud deletion', () => {
  const source = readProjectFile('services/dataManagement.ts');
  const imports = importStatements(source);

  assert.doesNotMatch(imports, /firebase/i);
  assert.doesNotMatch(source, /deleteUser\(/);
  assert.doesNotMatch(source, /deleteDoc\(/);
  assert.doesNotMatch(source, /writeBatch\(/);
  assert.match(source, /resetSensitiveDataStorage/);
});

test('local data reset observes all critical cleanup failures before rejecting', () => {
  const source = readProjectFile('services/dataManagement.ts');

  assert.match(source, /Promise\.allSettled/);
  assert.match(source, /Local data reset failed for/);
  assert.match(source, /getResetErrorMessage/);
  assert.doesNotMatch(
    source,
    /console\.warn\('Failed to cancel managed notifications during local data reset', error\)/,
  );
});

test('profile reset action does not claim Firebase account deletion', () => {
  const source = readProjectFile('app/profile/index.tsx');

  assert.match(source, /Delete Local Data/);
  assert.match(source, /does not delete your Firebase account/);
  assert.match(source, /Delete Account & Cloud Data/);
});

test('guest profile exposes local data export and reset controls', () => {
  const source = readProjectFile('app/profile/index.tsx');

  assert.match(source, /const GUEST_DATA_PRIVACY = \[/);
  assert.match(source, /label: 'Data Export'/);
  assert.match(source, /route: '\/profile\/data-export'/);
  assert.match(source, /label: 'Delete Local Data'/);
  assert.match(source, /handleDeleteLocalData\(\)/);
});
