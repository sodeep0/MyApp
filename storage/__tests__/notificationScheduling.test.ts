import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDateWithTime,
  dateToKey,
  DEFAULT_WEEKLY_REVIEW_TIME,
  goalNudgeCandidates,
  habitReminderCandidates,
  isManagedNotificationRecord,
  nextStreakAlertDate,
  parseGoalTargetDate,
  parseTime,
  routeForNotificationData,
  WEEKLY_REVIEW_WEEKDAY,
  weeklyReviewTime,
} from '../../services/notificationScheduling';
import {
  GoalCategory,
  GoalStatus,
  GoalType,
  HabitCategory,
  HabitFrequency,
  type Goal,
  type Habit,
  type HabitCompletion,
} from '../../types/models';

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    userId: 'user-1',
    title: 'Read 12 books',
    description: null,
    category: GoalCategory.LEARNING,
    goalType: GoalType.QUANTITATIVE,
    targetValue: 12,
    currentValue: 3,
    unit: 'books',
    milestones: [],
    targetDate: '2026-05-15T00:00:00',
    linkedHabitIds: [],
    status: GoalStatus.ACTIVE,
    createdAt: '2026-04-01T00:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

function createHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    name: 'Read',
    emoji: 'book',
    colorHex: '#BA8C63',
    category: HabitCategory.MIND,
    frequency: HabitFrequency.DAILY,
    weekDays: [],
    timesPerWeek: 1,
    everyNDays: 1,
    reminderTime: '07:30',
    createdAt: '2026-04-01T00:00:00.000Z',
    isArchived: false,
    streakShieldsRemaining: 0,
    ...overrides,
  };
}

test('parseTime accepts valid 24-hour reminder times and rejects invalid input', () => {
  assert.deepEqual(parseTime('07:30'), { hour: 7, minute: 30 });
  assert.deepEqual(parseTime('23:59'), { hour: 23, minute: 59 });
  assert.equal(parseTime('24:00'), null);
  assert.equal(parseTime('12:60'), null);
  assert.equal(parseTime('soon'), null);
});

test('date helpers preserve local date keys and apply reminder times', () => {
  const base = new Date(2026, 4, 6, 14, 45, 0, 0);
  const withTime = createDateWithTime(base, '08:15');

  assert.equal(dateToKey(base), '2026-05-06');
  assert.equal(withTime.getFullYear(), 2026);
  assert.equal(withTime.getMonth(), 4);
  assert.equal(withTime.getDate(), 6);
  assert.equal(withTime.getHours(), 8);
  assert.equal(withTime.getMinutes(), 15);
});

test('habitReminderCandidates skips archived habits and invalid reminder times', () => {
  const candidates = habitReminderCandidates([
    createHabit({ id: 'valid', reminderTime: '06:45' }),
    createHabit({ id: 'archived', reminderTime: '08:00', isArchived: true }),
    createHabit({ id: 'missing', reminderTime: null }),
    createHabit({ id: 'invalid', reminderTime: '25:00' }),
  ]);

  assert.deepEqual(
    candidates.map((candidate) => ({
      habitId: candidate.habit.id,
      reminderTime: candidate.reminderTime,
    })),
    [
      {
        habitId: 'valid',
        reminderTime: '06:45',
      },
    ],
  );
});

test('isManagedNotificationRecord only matches Kaarma-owned notifications', () => {
  assert.equal(
    isManagedNotificationRecord({
      identifier: 'kaarma:habit-reminder:habit-1',
    }),
    true,
  );
  assert.equal(
    isManagedNotificationRecord({
      identifier: 'external-id',
      content: {
        data: {
          scope: 'kaarma',
        },
      },
    }),
    true,
  );
  assert.equal(
    isManagedNotificationRecord({
      identifier: 'kaarma-lite:habit-reminder',
    }),
    false,
  );
  assert.equal(
    isManagedNotificationRecord({
      identifier: 'external-id',
      content: {
        data: {
          scope: 'other',
        },
      },
    }),
    false,
  );
});

test('routeForNotificationData maps managed notification payloads to existing routes', () => {
  assert.equal(
    routeForNotificationData({
      scope: 'kaarma',
      type: 'habit-reminder',
      habitId: 'habit 1',
    }),
    '/habits/detail?id=habit%201',
  );
  assert.equal(
    routeForNotificationData({
      scope: 'kaarma',
      type: 'streak-alert',
      habitId: 'habit-2',
    }),
    '/habits/detail?id=habit-2',
  );
  assert.equal(
    routeForNotificationData({
      scope: 'kaarma',
      type: 'goal-deadline',
      goalId: 'goal-1',
    }),
    '/goals/detail?id=goal-1',
  );
  assert.equal(
    routeForNotificationData({
      scope: 'kaarma',
      type: 'weekly-review',
    }),
    '/(tabs)',
  );
});

test('routeForNotificationData ignores unmanaged or malformed notification payloads', () => {
  assert.equal(routeForNotificationData(null), null);
  assert.equal(routeForNotificationData({ scope: 'other', type: 'weekly-review' }), null);
  assert.equal(routeForNotificationData({ scope: 'kaarma', type: 'habit-reminder' }), null);
  assert.equal(
    routeForNotificationData({
      scope: 'kaarma',
      type: 'goal-deadline',
      goalId: '   ',
    }),
    null,
  );
  assert.equal(
    routeForNotificationData({
      scope: 'kaarma',
      type: 'unknown',
    }),
    null,
  );
});

test('weekly review scheduling keeps Monday and falls back to the default time', () => {
  assert.equal(WEEKLY_REVIEW_WEEKDAY, 1);
  assert.equal(DEFAULT_WEEKLY_REVIEW_TIME, '18:30');
  assert.deepEqual(weeklyReviewTime('20:45'), { hour: 20, minute: 45 });
  assert.deepEqual(weeklyReviewTime('late'), { hour: 18, minute: 30 });
});

test('goal target date parsing treats date-only values as local calendar dates', () => {
  const parsed = parseGoalTargetDate('2026-05-15');

  assert.ok(parsed);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 4);
  assert.equal(parsed.getDate(), 15);
  assert.equal(parsed.getHours(), 0);
  assert.equal(parsed.getMinutes(), 0);
});

test('goal target date parsing rejects impossible date-only values', () => {
  assert.equal(parseGoalTargetDate('2026-02-30'), null);
  assert.equal(parseGoalTargetDate('2026-13-01'), null);
});

test('nextStreakAlertDate schedules today when incomplete before alert time', () => {
  const now = new Date(2026, 4, 6, 19, 0, 0, 0);
  const nextAlert = nextStreakAlertDate([], now);

  assert.equal(nextAlert.getDate(), 6);
  assert.equal(nextAlert.getHours(), 20);
  assert.equal(nextAlert.getMinutes(), 30);
});

test('nextStreakAlertDate moves to tomorrow when habit is already complete today', () => {
  const now = new Date(2026, 4, 6, 19, 0, 0, 0);
  const completions: HabitCompletion[] = [
    {
      id: 'completion-1',
      habitId: 'habit-1',
      completedDate: '2026-05-06',
      completedAt: '2026-05-06T07:00:00.000Z',
    },
  ];
  const nextAlert = nextStreakAlertDate(completions, now);

  assert.equal(nextAlert.getDate(), 7);
  assert.equal(nextAlert.getHours(), 20);
  assert.equal(nextAlert.getMinutes(), 30);
});

test('goalNudgeCandidates returns week, day, and day-of nudges for active dated goals', () => {
  const nudges = goalNudgeCandidates(createGoal());

  assert.deepEqual(nudges.map((nudge) => nudge.idSuffix), ['week', 'day', 'today']);
  assert.equal(dateToKey(nudges[0].triggerDate), '2026-05-08');
  assert.equal(dateToKey(nudges[1].triggerDate), '2026-05-14');
  assert.equal(dateToKey(nudges[2].triggerDate), '2026-05-15');
  assert.equal(nudges.every((nudge) => nudge.triggerDate.getHours() === 9), true);
});

test('goalNudgeCandidates handles date-only target dates without calendar-day rollover', () => {
  const nudges = goalNudgeCandidates(createGoal({ targetDate: '2026-05-15' }));

  assert.equal(dateToKey(nudges[0].triggerDate), '2026-05-08');
  assert.equal(dateToKey(nudges[1].triggerDate), '2026-05-14');
  assert.equal(dateToKey(nudges[2].triggerDate), '2026-05-15');
});

test('goalNudgeCandidates skips completed, open-ended, and invalid-date goals', () => {
  assert.deepEqual(goalNudgeCandidates(createGoal({ status: GoalStatus.COMPLETED })), []);
  assert.deepEqual(goalNudgeCandidates(createGoal({ targetDate: null })), []);
  assert.deepEqual(goalNudgeCandidates(createGoal({ targetDate: 'not-a-date' })), []);
  assert.deepEqual(goalNudgeCandidates(createGoal({ targetDate: '2026-02-30' })), []);
});
