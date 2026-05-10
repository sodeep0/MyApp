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

test('account deletion service deletes only cloud-eligible Firestore paths before local reset', () => {
  const source = readProjectFile('services/accountDeletion.ts');

  assert.match(source, /users\/\$\{uid\}\/habits/);
  assert.match(source, /users\/\$\{uid\}\/goals/);
  assert.match(source, /users\/\$\{uid\}\/activities/);
  assert.match(source, /users\/\$\{uid\}/);
  assert.match(source, /deleteUser\(user\)/);
  assert.match(source, /resetLocalAppData\(\)/);
  assert.match(source, /completions/);
});

test('account deletion service converts Firebase recent-login failures to a typed error', () => {
  const source = readProjectFile('services/accountDeletion.ts');

  assert.match(source, /AccountDeletionRequiresRecentLoginError/);
  assert.match(source, /isFirebaseRecentLoginError/);
  assert.match(source, /auth\/requires-recent-login/);
  assert.match(source, /throw new AccountDeletionRequiresRecentLoginError\(\)/);
});

test('account deletion service does not import local-only sensitive stores or Firebase-sensitive paths', () => {
  const source = readProjectFile('services/accountDeletion.ts');
  const imports = importStatements(source);

  assert.doesNotMatch(imports, /journalStore/);
  assert.doesNotMatch(imports, /badHabitStore/);
  assert.doesNotMatch(source, /journal/i);
  assert.doesNotMatch(source, /badHabit/i);
  assert.doesNotMatch(source, /bad-habit/i);
});

test('profile exposes account deletion separately from local-only data reset', () => {
  const source = readProjectFile('app/profile/index.tsx');

  assert.match(source, /Delete Local Data/);
  assert.match(source, /Delete Account & Cloud Data/);
  assert.match(source, /deleteSignedInAccountAndData/);
  assert.match(source, /isAccountDeletionRequiresRecentLoginError/);
  assert.match(source, /deletes your Firebase account plus synced profile, habits, goals, and activity data/);
  assert.match(source, /Journal and bad-habit recovery records are local-only/);
  assert.match(source, /router\.push\('\/auth\/sign-in' as any\)/);
});
