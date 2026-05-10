import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

function withoutComments(source: string): string {
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
}

test('Firestore rules only allow cloud-eligible Kaarma modules', () => {
  const source = readProjectFile('firestore.rules');
  const executableRules = withoutComments(source);

  assert.match(executableRules, /match\s+\/users\/\{uid\}/);
  assert.match(executableRules, /match\s+\/habits\/\{habitId\}/);
  assert.match(executableRules, /match\s+\/goals\/\{goalId\}/);
  assert.match(executableRules, /match\s+\/activities\/\{activityId\}/);
  assert.match(executableRules, /match\s+\/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);

  assert.doesNotMatch(executableRules, /match\s+\/users\/\{uid\}\/journal/i);
  assert.doesNotMatch(executableRules, /match\s+\/users\/\{uid\}\/journals/i);
  assert.doesNotMatch(executableRules, /match\s+\/users\/\{uid\}\/badHabits/i);
  assert.doesNotMatch(executableRules, /match\s+\/users\/\{uid\}\/urgeEvents/i);
});

test('Firestore rules explicitly deny known sensitive top-level collection names', () => {
  const source = readProjectFile('firestore.rules');

  for (const collectionName of ['journal', 'journals', 'badHabits', 'urgeEvents']) {
    assert.match(
      source,
      new RegExp(`match\\s+\\/${collectionName}\\/\\{docId\\}\\s*\\{\\s*allow read, write: if false;`),
    );
  }
});

test('Firestore schema docs keep sensitive modules out of cloud collections', () => {
  const source = readProjectFile('docs/firestore-schema.md');

  assert.match(source, /Profile, Habits, Goals, and Activity sync to Firebase/);
  assert.match(source, /Journal and Bad Habits remain local-only/);
  assert.match(source, /No journal or bad-habit collections are allowed in Firestore/);
  assert.match(source, /Journal and Bad Habits must not be migrated to Firestore/);
});
