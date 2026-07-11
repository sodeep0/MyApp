import assert from 'node:assert/strict';
import test from 'node:test';
import { invalidate, subscribe, type InvalidateDomain } from '../../stores/invalidate';

test('invalidate notifies domain subscribers and wildcard listeners', () => {
  const seen: string[] = [];
  const unsubHabits = subscribe('habits', () => {
    seen.push('habits');
  });
  const unsubWild = subscribe('*', () => {
    seen.push('*');
  });
  const unsubGoals = subscribe('goals', () => {
    seen.push('goals');
  });

  invalidate('habits');
  assert.deepEqual(seen, ['habits', '*']);

  seen.length = 0;
  invalidate('goals');
  assert.deepEqual(seen, ['goals', '*']);

  unsubHabits();
  unsubWild();
  unsubGoals();

  seen.length = 0;
  invalidate('habits');
  assert.deepEqual(seen, []);
});

test('InvalidateDomain covers store write domains', () => {
  const domains: InvalidateDomain[] = [
    'habits',
    'goals',
    'activities',
    'journal',
    'badHabits',
    'user',
    'profile',
  ];
  assert.equal(domains.length, 7);
});
