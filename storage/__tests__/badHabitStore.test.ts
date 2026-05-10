import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { normalizeBadHabits, normalizeUrgeEvents } from '../../stores/badHabitEntryNormalization';
import {
  BadHabitCategory,
  BadHabitSeverity,
  UrgeEventType,
  type BadHabit,
  type UrgeEvent,
} from '../../types/models';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

function badHabit(id: string, quitDate: string): BadHabit {
  return {
    id,
    userId: 'local',
    name: 'Doomscrolling',
    category: BadHabitCategory.DIGITAL,
    severity: BadHabitSeverity.MODERATE,
    quitDate,
    notes: null,
    createdAt: `${quitDate}T09:00:00.000Z`,
  };
}

function urgeEvent(id: string, badHabitId: string, loggedAt: string): UrgeEvent {
  return {
    id,
    badHabitId,
    type: UrgeEventType.RESISTED,
    note: null,
    triggerTag: null,
    resetCounter: false,
    loggedAt,
  };
}

test('bad-habit reads ignore malformed persisted habits', () => {
  const habits = normalizeBadHabits([
    badHabit('valid-1', '2026-05-01'),
    null,
    { id: 'missing-quit-date' },
    { id: 42, quitDate: '2026-05-02' },
    badHabit('valid-2', '2026-05-03'),
  ]);

  assert.deepEqual(habits.map((habit) => habit.id), ['valid-1', 'valid-2']);
});

test('urge-event reads ignore malformed persisted events before habit filtering', () => {
  const events = normalizeUrgeEvents([
    urgeEvent('event-1', 'habit-1', '2026-05-01T10:00:00.000Z'),
    null,
    { id: 'missing-habit-id', loggedAt: '2026-05-02T10:00:00.000Z' },
    { id: 'missing-logged-at', badHabitId: 'habit-1' },
    urgeEvent('event-2', 'habit-2', '2026-05-03T10:00:00.000Z'),
  ]);

  assert.deepEqual(
    events.filter((event) => event.badHabitId === 'habit-1').map((event) => event.id),
    ['event-1'],
  );
});

test('bad-habit and urge-event reads treat non-array persisted values as empty', () => {
  assert.deepEqual(normalizeBadHabits({ id: 'not-an-array', quitDate: '2026-05-01' }), []);
  assert.deepEqual(normalizeUrgeEvents({ id: 'not-an-array', badHabitId: 'habit-1' }), []);
});

test('bad-habit writes normalize sensitive local data before persistence', () => {
  const source = readProjectFile('stores/badHabitStore.ts');

  assert.match(source, /value: normalizeBadHabits\(habits\)/);
  assert.match(source, /value: normalizeUrgeEvents\(events\)/);
});
