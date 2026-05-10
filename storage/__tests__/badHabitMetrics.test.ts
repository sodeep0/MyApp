import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bestStreakDays,
  currentStreakDays,
  daysSinceQuit,
  totalCleanDays,
} from '../../stores/badHabitMetrics';
import { UrgeEventType, type UrgeEvent } from '../../types/models';

function relapse(id: string, loggedAt: string, resetCounter = true): UrgeEvent {
  return {
    id,
    badHabitId: 'bad-habit-1',
    type: UrgeEventType.RELAPSE,
    note: null,
    triggerTag: null,
    resetCounter,
    loggedAt,
  };
}

function resisted(id: string, loggedAt: string): UrgeEvent {
  return {
    id,
    badHabitId: 'bad-habit-1',
    type: UrgeEventType.RESISTED,
    note: null,
    triggerTag: null,
    resetCounter: false,
    loggedAt,
  };
}

test('daysSinceQuit counts local day boundaries and clamps invalid/future dates', () => {
  const now = new Date(2026, 4, 10, 18, 30, 0, 0);

  assert.equal(daysSinceQuit('2026-05-01', now), 9);
  assert.equal(daysSinceQuit('2026-05-11', now), 0);
  assert.equal(daysSinceQuit('not-a-date', now), 0);
});

test('currentStreakDays resets from the latest relapse that resets the counter', () => {
  const now = new Date(2026, 4, 10, 18, 30, 0, 0);
  const events = [
    resisted('urge-1', '2026-05-04T12:00:00'),
    relapse('relapse-1', '2026-05-05T21:00:00'),
    relapse('relapse-ignored', '2026-05-08T21:00:00', false),
  ];

  assert.equal(currentStreakDays('2026-05-01', events, now), 5);
});

test('bestStreakDays returns the longest segment between reset relapses', () => {
  const now = new Date(2026, 4, 20, 18, 30, 0, 0);
  const events = [
    relapse('relapse-1', '2026-05-04T21:00:00'),
    relapse('relapse-2', '2026-05-10T21:00:00'),
  ];

  assert.equal(bestStreakDays('2026-05-01', events, now), 10);
});

test('totalCleanDays subtracts reset relapses from elapsed quit days', () => {
  const now = new Date(2026, 4, 10, 18, 30, 0, 0);
  const events = [
    relapse('relapse-1', '2026-05-04T21:00:00'),
    relapse('relapse-2', '2026-05-05T21:00:00'),
    relapse('relapse-ignored', '2026-05-06T21:00:00', false),
  ];

  assert.equal(totalCleanDays('2026-05-01', events, now), 7);
});

test('same-day reset relapses count as one reset day for clean-day totals', () => {
  const now = new Date(2026, 4, 10, 18, 30, 0, 0);
  const events = [
    relapse('relapse-1', '2026-05-04T09:00:00'),
    relapse('relapse-2', '2026-05-04T21:00:00'),
    relapse('relapse-3', '2026-05-05T21:00:00'),
  ];

  assert.equal(totalCleanDays('2026-05-01', events, now), 7);
});

test('future reset relapses do not affect recovery metrics', () => {
  const now = new Date(2026, 4, 10, 18, 30, 0, 0);
  const events = [
    relapse('relapse-1', '2026-05-04T21:00:00'),
    relapse('future-relapse', '2026-05-12T21:00:00'),
  ];

  assert.equal(currentStreakDays('2026-05-01', events, now), 6);
  assert.equal(bestStreakDays('2026-05-01', events, now), 6);
  assert.equal(totalCleanDays('2026-05-01', events, now), 8);
});
