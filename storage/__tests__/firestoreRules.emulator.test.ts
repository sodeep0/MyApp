/**
 * Firestore security rules tests.
 *
 * Runs against the Firestore emulator when FIRESTORE_EMULATOR_HOST is set
 * (e.g. `127.0.0.1:8080`). Skips cleanly otherwise so CI without emulators
 * stays green.
 *
 * Local:
 *   firebase emulators:start --only firestore
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run test:rules
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
const PROJECT_ID = 'kaarma-rules-test';

test('firestore rules file encodes owner isolation helpers', () => {
  const source = readFileSync(join(projectRoot, 'firestore.rules'), 'utf8');
  assert.match(source, /function isOwner\(uid\)/);
  assert.match(source, /request\.auth\.uid == uid/);
  assert.match(source, /function hasUserId\(uid\)/);
  assert.match(source, /match \/users\/\{uid\}/);
  assert.match(source, /match \/habits\/\{habitId\}/);
  assert.match(source, /match \/goals\/\{goalId\}/);
  assert.match(source, /match \/activities\/\{activityId\}/);
  assert.doesNotMatch(source, /match \/users\/\{uid\}\/journal/i);
});

test(
  'firestore rules deny cross-user habit access (emulator)',
  { skip: !emulatorHost ? 'FIRESTORE_EMULATOR_HOST not set; skipping emulator rules test' : false },
  async () => {
    const {
      assertFails,
      assertSucceeds,
      initializeTestEnvironment,
    } = await import('@firebase/rules-unit-testing');

    const rules = readFileSync(join(projectRoot, 'firestore.rules'), 'utf8');
    const testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: { rules, host: '127.0.0.1', port: Number(String(emulatorHost).split(':')[1] || 8080) },
    });

    try {
      await testEnv.clearFirestore();

      const owner = testEnv.authenticatedContext('owner-uid');
      const intruder = testEnv.authenticatedContext('intruder-uid');
      const ownerDb = owner.firestore();
      const intruderDb = intruder.firestore();

      const habitRef = ownerDb.doc('users/owner-uid/habits/habit-1');
      await assertSucceeds(
        habitRef.set({
          id: 'habit-1',
          userId: 'owner-uid',
          name: 'Read',
          createdAt: new Date().toISOString(),
        }),
      );

      await assertFails(intruderDb.doc('users/owner-uid/habits/habit-1').get());
      await assertFails(
        intruderDb.doc('users/owner-uid/habits/habit-2').set({
          id: 'habit-2',
          userId: 'owner-uid',
          name: 'Hack',
          createdAt: new Date().toISOString(),
        }),
      );
      await assertFails(
        intruderDb.doc('users/intruder-uid/habits/habit-3').set({
          id: 'habit-3',
          userId: 'owner-uid',
          name: 'Spoofed owner',
          createdAt: new Date().toISOString(),
        }),
      );
    } finally {
      await testEnv.cleanup();
    }
  },
);
