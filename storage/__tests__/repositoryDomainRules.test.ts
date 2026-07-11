import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, test } from 'node:test';
import { FREE_TIER_LIMITS, isActivityEditWindowExpiredError } from '../../constants/featureLimits';
import { normalizeActivities } from '../../repositories/activityNormalization';
import { normalizeGoals } from '../../repositories/goalNormalization';
import { normalizeHabitCompletions, normalizeHabits } from '../../repositories/habitNormalization';
import { userLocalRepository, DISPLAY_NAME_KEY } from '../../repositories/local/userRepository.local';
import { normalizeUserProfile, normalizeSelectedIntentions } from '../../repositories/userNormalization';
import { activityLocalRepository } from '../../repositories/local/activityRepository.local';
import { goalLocalRepository } from '../../repositories/local/goalRepository.local';
import { habitLocalRepository } from '../../repositories/local/habitRepository.local';
import { setStoredPremiumState } from '../../services/subscription';
import {
  ActivityCategory,
  ActivityIntensity,
  GoalCategory,
  GoalStatus,
  GoalType,
  HabitCategory,
  HabitFrequency,
  Intention,
  type ActivityLog,
  type Goal,
  type Habit,
  type HabitCompletion,
} from '../../types/models';
import { storage } from '../asyncStorage';

const USER_PROFILE_KEY = 'kaarma_user_profile';
const ONBOARDING_KEY = 'kaarma_onboarding_completed';
const INTENTIONS_KEY = 'kaarma_selected_intentions';
const GOALS_KEY = 'kaarma_goals';
const ACTIVITY_KEY = 'kaarma_activity_logs';
const HABITS_KEY = 'kaarma_habits';
const COMPLETIONS_KEY = 'kaarma_habit_completions';
const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

function installLocalStorage(): void {
  const values = new Map<string, string>();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => {
          values.set(key, value);
        },
        removeItem: (key: string) => {
          values.delete(key);
        },
      },
    },
  });
}

function createGoal(id: string, status: GoalStatus = GoalStatus.ACTIVE): Goal {
  return {
    id,
    userId: 'local',
    title: `Goal ${id}`,
    description: null,
    category: GoalCategory.PERSONAL,
    goalType: GoalType.QUANTITATIVE,
    targetValue: 10,
    currentValue: 0,
    unit: 'times',
    milestones: [],
    targetDate: null,
    linkedHabitIds: [],
    status,
    createdAt: '2026-04-01T00:00:00.000Z',
    completedAt: null,
  };
}

function createGoalInput(
  id: string,
  status: GoalStatus = GoalStatus.ACTIVE,
): Omit<Goal, 'id' | 'createdAt' | 'completedAt'> {
  const { id: _id, createdAt: _createdAt, completedAt: _completedAt, ...input } = createGoal(id, status);
  return input;
}

function createHabit(id: string): Habit {
  return {
    id,
    userId: 'local',
    name: `Habit ${id}`,
    emoji: '✓',
    colorHex: '#81A6C6',
    category: HabitCategory.PERSONAL,
    frequency: HabitFrequency.DAILY,
    weekDays: [1, 2, 3, 4, 5, 6, 7],
    timesPerWeek: 0,
    everyNDays: 0,
    reminderTime: null,
    createdAt: '2026-04-01T00:00:00.000Z',
    isArchived: false,
    streakShieldsRemaining: 0,
  };
}

function createActivity(loggedAt: string): ActivityLog {
  return {
    id: 'activity-1',
    userId: 'local',
    name: 'Deep Work',
    category: ActivityCategory.WORK,
    durationMinutes: 60,
    date: '2026-04-01',
    time: '09:00',
    intensity: ActivityIntensity.HIGH,
    notes: null,
    loggedAt,
  };
}

beforeEach(() => {
  installLocalStorage();
});

test('goal repository enforces free active-goal cap at the domain layer', async () => {
  await setStoredPremiumState(false);
  await goalLocalRepository.saveGoals(
    Array.from({ length: FREE_TIER_LIMITS.ACTIVE_GOALS }, (_, index) =>
      createGoal(`goal-${index + 1}`),
    ),
  );

  await assert.rejects(
    goalLocalRepository.addGoal(createGoalInput('goal-over-limit')),
    /Premium is required/,
  );
});

test('goal repository allows inactive goals beyond the active-goal cap', async () => {
  await setStoredPremiumState(false);
  await goalLocalRepository.saveGoals(
    Array.from({ length: FREE_TIER_LIMITS.ACTIVE_GOALS }, (_, index) =>
      createGoal(`goal-${index + 1}`),
    ),
  );

  const added = await goalLocalRepository.addGoal(createGoalInput('archived-goal', GoalStatus.ABANDONED));

  assert.equal(added.status, GoalStatus.ABANDONED);
});

test('goal repository rejects reactivating inactive goals over the free active-goal cap', async () => {
  await setStoredPremiumState(false);
  await goalLocalRepository.saveGoals([
    ...Array.from({ length: FREE_TIER_LIMITS.ACTIVE_GOALS }, (_, index) =>
      createGoal(`goal-${index + 1}`),
    ),
    createGoal('paused-goal', GoalStatus.ABANDONED),
  ]);

  await assert.rejects(
    goalLocalRepository.updateGoal('paused-goal', { status: GoalStatus.ACTIVE }),
    /Premium is required/,
  );

  const unchangedGoal = await goalLocalRepository.getGoalById('paused-goal');
  assert.equal(unchangedGoal?.status, GoalStatus.ABANDONED);
});

test('goal repository ignores malformed persisted goals before domain operations', async () => {
  await goalLocalRepository.saveGoals([
    createGoal('active-goal'),
    { id: 'bad-current-value', title: 'Bad', status: GoalStatus.ACTIVE, currentValue: '0', targetValue: 1 } as any,
    { id: 'bad-status', title: 'Bad', status: 'PAUSED', currentValue: 0, targetValue: 1 } as any,
  ]);

  assert.deepEqual(
    (await goalLocalRepository.getAllGoals()).map((goal) => goal.id),
    ['active-goal'],
  );
  assert.equal(await goalLocalRepository.getActiveGoalCount(), 1);
});

test('goal repository does not persist malformed goals on save', async () => {
  await goalLocalRepository.saveGoals([
    createGoal('valid-goal'),
    { id: 'bad-status', title: 'Bad', status: 'PAUSED', currentValue: 0, targetValue: 1 } as any,
  ]);

  const stored = await storage.getItem<Goal[]>(GOALS_KEY, []);
  assert.deepEqual(stored?.map((goal) => goal.id), ['valid-goal']);
});

test('goal repository rejects invalid progress increments before persisting', async () => {
  await goalLocalRepository.saveGoals([createGoal('progress-goal')]);

  await assert.rejects(
    goalLocalRepository.incrementGoalProgress('progress-goal', Number.NaN),
    /Goal progress increment amount must be a finite number/,
  );
  await assert.rejects(
    goalLocalRepository.incrementGoalProgress('progress-goal', Infinity),
    /Goal progress increment amount must be a finite number/,
  );
  await assert.rejects(
    goalLocalRepository.incrementGoalProgress('progress-goal', '1' as any),
    /Goal progress increment amount must be a finite number/,
  );

  assert.equal((await goalLocalRepository.getGoalById('progress-goal'))?.currentValue, 0);
});

test('goal repository rejects invalid updates without dropping existing goals', async () => {
  await goalLocalRepository.saveGoals([createGoal('stable-goal')]);

  await assert.rejects(
    goalLocalRepository.updateGoal('stable-goal', { status: 'PAUSED' as any }),
    /Goal update would create invalid goal data/,
  );

  const stored = await goalLocalRepository.getGoalById('stable-goal');
  assert.equal(stored?.status, GoalStatus.ACTIVE);
  assert.equal(stored?.currentValue, 0);
});

test('goal repository rejects blank delete ids before persisting', async () => {
  await goalLocalRepository.saveGoals([createGoal('stable-goal')]);

  await assert.rejects(
    goalLocalRepository.deleteGoal('   '),
    /Goal id must be a non-empty string/,
  );

  assert.deepEqual(
    (await goalLocalRepository.getAllGoals()).map((goal) => goal.id),
    ['stable-goal'],
  );
});

test('goal normalization removes malformed milestones from otherwise valid goals', () => {
  const [goal] = normalizeGoals([
    {
      ...createGoal('goal-with-milestones'),
      milestones: [
        {
          id: 'valid-milestone',
          title: 'Valid',
          isCompleted: false,
          completedAt: null,
        },
        {
          id: 'missing-completion-state',
          title: 'Bad',
          completedAt: null,
        },
      ],
    },
  ]);

  assert.deepEqual(goal.milestones.map((milestone) => milestone.id), ['valid-milestone']);
});

test('activity repository rejects updates outside the edit window', async () => {
  const expiredLoggedAt = new Date(
    Date.now() - (FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS + 1) * 60 * 60 * 1000,
  ).toISOString();
  await activityLocalRepository.saveActivities([createActivity(expiredLoggedAt)]);

  await assert.rejects(
    activityLocalRepository.updateActivity('activity-1', { notes: 'late edit' }),
    (error) => {
      assert.equal(isActivityEditWindowExpiredError(error), true);
      return true;
    },
  );
});

test('activity repository ignores malformed persisted activities before summaries and edits', async () => {
  const validActivity = createActivity(new Date().toISOString());
  await activityLocalRepository.saveActivities([
    validActivity,
    { id: 'missing-logged-at', name: 'Bad', durationMinutes: 15 } as any,
    { ...createActivity('2026-04-02T09:00:00.000Z'), id: 'bad-duration', durationMinutes: Number.NaN } as any,
  ]);

  assert.deepEqual(
    (await activityLocalRepository.getAllActivities()).map((activity) => activity.id),
    [validActivity.id],
  );
  assert.equal((await activityLocalRepository.getWeeklySummary()).totalMinutes, validActivity.durationMinutes);
});

test('activity repository does not persist malformed activities on save', async () => {
  await activityLocalRepository.saveActivities([
    createActivity(new Date().toISOString()),
    { id: 'missing-logged-at', name: 'Bad', durationMinutes: 15 } as any,
  ]);

  const stored = await storage.getItem<ActivityLog[]>(ACTIVITY_KEY, []);
  assert.deepEqual(stored?.map((activity) => activity.id), ['activity-1']);
});

test('activity repository rejects invalid updates without dropping existing activities', async () => {
  const activity = createActivity(new Date().toISOString());
  await activityLocalRepository.saveActivities([activity]);

  await assert.rejects(
    activityLocalRepository.updateActivity(activity.id, { durationMinutes: Number.NaN }),
    /Activity update would create invalid activity data/,
  );

  const stored = await activityLocalRepository.getActivityById(activity.id);
  assert.equal(stored?.durationMinutes, activity.durationMinutes);
});

test('activity repository rejects blank delete ids before persisting', async () => {
  const activity = createActivity(new Date().toISOString());
  await activityLocalRepository.saveActivities([activity]);

  await assert.rejects(
    activityLocalRepository.deleteActivity('   '),
    /Activity id must be a non-empty string/,
  );

  assert.deepEqual(
    (await activityLocalRepository.getAllActivities()).map((entry) => entry.id),
    [activity.id],
  );
});

test('activity normalization treats non-array persisted values as empty', () => {
  assert.deepEqual(normalizeActivities({ id: 'not-an-array', loggedAt: '2026-04-01T09:00:00.000Z' }), []);
});

test('habit repository deletes completions for deleted habits only', async () => {
  const deletedHabit = createHabit('habit-deleted');
  const keptHabit = createHabit('habit-kept');
  const completions: HabitCompletion[] = [
    {
      id: 'completion-deleted',
      habitId: deletedHabit.id,
      completedDate: '2026-04-01',
      completedAt: '2026-04-01T08:00:00.000Z',
    },
    {
      id: 'completion-kept',
      habitId: keptHabit.id,
      completedDate: '2026-04-01',
      completedAt: '2026-04-01T09:00:00.000Z',
    },
  ];

  await habitLocalRepository.saveHabits([deletedHabit, keptHabit]);
  await habitLocalRepository.saveCompletions(completions);

  await habitLocalRepository.deleteHabit(deletedHabit.id);

  assert.deepEqual(await habitLocalRepository.getCompletionsForHabit(deletedHabit.id), []);
  assert.deepEqual(
    await habitLocalRepository.getCompletionsForHabit(keptHabit.id),
    [{
      ...completions[1],
      updatedAt: completions[1].completedAt,
    }],
  );
});

test('habit repository ignores malformed persisted habits and completions before domain operations', async () => {
  const validHabit = createHabit('habit-valid');
  await habitLocalRepository.saveHabits([
    validHabit,
    { id: 'bad-frequency', name: 'Bad', frequency: 'MONTHLY' } as any,
    { ...createHabit('bad-week-days'), weekDays: ['1', 2, 8] as any },
  ]);
  await habitLocalRepository.saveCompletions([
    {
      id: 'valid-completion',
      habitId: validHabit.id,
      completedDate: '2026-04-01',
      completedAt: '2026-04-01T09:00:00.000Z',
    },
    { id: 'missing-date', habitId: validHabit.id, completedAt: '2026-04-01T10:00:00.000Z' } as any,
    { id: 'missing-habit', completedDate: '2026-04-01', completedAt: '2026-04-01T10:00:00.000Z' } as any,
  ]);

  assert.deepEqual(
    (await habitLocalRepository.getAllHabits()).map((habit) => `${habit.id}:${habit.weekDays.join(',')}`),
    [`${validHabit.id}:1,2,3,4,5,6`, 'bad-week-days:2'],
  );
  assert.deepEqual(
    (await habitLocalRepository.getCompletionsForHabit(validHabit.id)).map((completion) => completion.id),
    ['valid-completion'],
  );
});

test('habit repository does not persist malformed habits or completions on save', async () => {
  const validHabit = createHabit('habit-valid');
  await habitLocalRepository.saveHabits([
    validHabit,
    { id: 'bad-frequency', name: 'Bad', frequency: 'MONTHLY' } as any,
  ]);
  await habitLocalRepository.saveCompletions([
    {
      id: 'valid-completion',
      habitId: validHabit.id,
      completedDate: '2026-04-01',
      completedAt: '2026-04-01T09:00:00.000Z',
    },
    { id: 'missing-date', habitId: validHabit.id, completedAt: '2026-04-01T10:00:00.000Z' } as any,
  ]);

  const storedHabits = await storage.getItem<Habit[]>(HABITS_KEY, []);
  const storedCompletions = await storage.getItem<HabitCompletion[]>(COMPLETIONS_KEY, []);

  assert.deepEqual(storedHabits?.map((habit) => habit.id), [validHabit.id]);
  assert.deepEqual(storedCompletions?.map((completion) => completion.id), ['valid-completion']);
});

test('habit repository rejects invalid additions before persisting', async () => {
  await habitLocalRepository.saveHabits([createHabit('existing-habit')]);

  await assert.rejects(
    habitLocalRepository.addHabit({
      ...createHabit('invalid-add'),
      id: undefined,
      createdAt: undefined,
      isArchived: undefined,
      streakShieldsRemaining: undefined,
      frequency: 'MONTHLY',
    } as any),
    /Habit data must be valid before saving/,
  );

  assert.deepEqual(
    (await habitLocalRepository.getAllHabits()).map((habit) => habit.id),
    ['existing-habit'],
  );
});

test('habit repository rejects invalid updates without dropping existing habits', async () => {
  const habit = createHabit('stable-habit');
  await habitLocalRepository.saveHabits([habit]);

  await assert.rejects(
    habitLocalRepository.updateHabit(habit.id, { frequency: 'MONTHLY' as any }),
    /Habit update would create invalid habit data/,
  );

  const stored = await habitLocalRepository.getHabitById(habit.id);
  assert.equal(stored?.frequency, habit.frequency);
  assert.equal(stored?.name, habit.name);
});

test('habit repository rejects orphan completions before persisting', async () => {
  await assert.rejects(
    habitLocalRepository.markHabitComplete('missing-habit'),
    /Habit must exist before it can be completed/,
  );

  const storedCompletions = await storage.getItem<HabitCompletion[]>(COMPLETIONS_KEY, []);
  assert.deepEqual(storedCompletions, []);
});

test('habit repository rejects blank delete ids before persisting', async () => {
  const habit = createHabit('stable-habit');
  const completion: HabitCompletion = {
    id: 'completion-1',
    habitId: habit.id,
    completedDate: '2026-04-01',
    completedAt: '2026-04-01T09:00:00.000Z',
  };
  await habitLocalRepository.saveHabits([habit]);
  await habitLocalRepository.saveCompletions([completion]);

  await assert.rejects(
    habitLocalRepository.deleteHabit('   '),
    /Habit id must be a non-empty string/,
  );

  assert.deepEqual(
    (await habitLocalRepository.getAllHabits()).map((storedHabit) => storedHabit.id),
    [habit.id],
  );
  assert.deepEqual(
    await habitLocalRepository.getCompletionsForHabit(habit.id),
    [{ ...completion, updatedAt: completion.completedAt }],
  );
});

test('habit repository rejects blank unmark ids before persisting', async () => {
  const habit = createHabit('stable-habit');
  const today = new Date();
  const completedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  const completion: HabitCompletion = {
    id: 'completion-1',
    habitId: habit.id,
    completedDate,
    completedAt: `${completedDate}T09:00:00.000Z`,
  };
  await habitLocalRepository.saveHabits([habit]);
  await habitLocalRepository.saveCompletions([completion]);

  await assert.rejects(
    habitLocalRepository.unmarkHabitComplete('   '),
    /Habit id must be a non-empty string/,
  );

  assert.deepEqual(
    await habitLocalRepository.getCompletionsForHabit(habit.id),
    [{ ...completion, updatedAt: completion.completedAt }],
  );
});

test('habit normalization treats non-array persisted values as empty', () => {
  assert.deepEqual(normalizeHabits({ id: 'not-an-array' }), []);
  assert.deepEqual(normalizeHabitCompletions({ id: 'not-an-array' }), []);
});

test('user repository normalizes malformed profile preferences to guest-safe values', async () => {
  await storage.setItem(USER_PROFILE_KEY, {
    displayName: 'Asha',
    email: 42,
    avatar: { uri: 'bad' },
    bio: null,
    onboardingCompleted: 'true',
    selectedIntentions: [Intention.GOALS, 'UNKNOWN'],
  });
  await storage.setItem(DISPLAY_NAME_KEY, { value: 'bad' });
  await storage.setItem(INTENTIONS_KEY, [Intention.JOURNALING, 'UNKNOWN', 42]);

  assert.deepEqual(await userLocalRepository.getUserProfile(), {
    displayName: 'Asha',
    email: '',
    avatar: null,
    bio: '',
    onboardingCompleted: false,
    selectedIntentions: [Intention.GOALS],
  });
  assert.equal(await userLocalRepository.getDisplayName(), 'User');
  assert.deepEqual(await userLocalRepository.getSelectedIntentions(), [Intention.JOURNALING]);
});

test('user repository does not persist malformed profile preferences on save', async () => {
  await userLocalRepository.saveUserProfile({
    displayName: 'Asha',
    email: 42,
    avatar: { uri: 'bad' },
    bio: null,
    onboardingCompleted: 'true',
    selectedIntentions: [Intention.GOALS, 'UNKNOWN'],
  } as any);
  await userLocalRepository.saveSelectedIntentions([Intention.JOURNALING, 'UNKNOWN', 42] as any);

  const storedProfile = await storage.getItem(USER_PROFILE_KEY, null);
  const storedIntentions = await storage.getItem(INTENTIONS_KEY, []);

  assert.deepEqual(storedProfile, {
    displayName: 'Asha',
    email: '',
    avatar: null,
    bio: '',
    onboardingCompleted: false,
    selectedIntentions: [Intention.GOALS],
  });
  assert.deepEqual(storedIntentions, [Intention.JOURNALING]);
});

test('user repository normalizes display-name writes before persisting profile data', async () => {
  await userLocalRepository.saveUserProfile({
    displayName: 'Asha',
    email: 'asha@example.com',
    avatar: null,
    bio: '',
    onboardingCompleted: true,
    selectedIntentions: [Intention.GOALS],
  });

  await userLocalRepository.updateDisplayName('   ');

  assert.equal(await userLocalRepository.getDisplayName(), 'User');
  assert.deepEqual(await userLocalRepository.getUserProfile(), {
    displayName: 'User',
    email: 'asha@example.com',
    avatar: null,
    bio: '',
    onboardingCompleted: true,
    selectedIntentions: [Intention.GOALS],
  });
});

test('user repository normalizes onboarding completion writes to booleans', async () => {
  await userLocalRepository.setOnboardingCompleted('true' as any);

  assert.equal(await storage.getItem(ONBOARDING_KEY, null), false);
  assert.equal(await userLocalRepository.isOnboardingCompleted(), false);

  await userLocalRepository.setOnboardingCompleted(true);

  assert.equal(await storage.getItem(ONBOARDING_KEY, null), true);
  assert.equal(await userLocalRepository.isOnboardingCompleted(), true);
});

test('user normalization rejects unusable profiles and non-array intentions', () => {
  assert.equal(normalizeUserProfile({ email: 'missing-name@example.com' }), null);
  assert.equal(normalizeUserProfile({ displayName: '   ' })?.displayName, 'User');
  assert.deepEqual(normalizeSelectedIntentions({ intention: Intention.GOALS }), []);
});

test('firebase sync flushers validate queued payloads before cloud writes', () => {
  const files = [
    'repositories/firebase/userRepository.firebase.ts',
    'repositories/firebase/habitRepository.firebase.ts',
    'repositories/firebase/goalRepository.firebase.ts',
    'repositories/firebase/activityRepository.firebase.ts',
  ];

  for (const file of files) {
    const source = readProjectFile(file);
    assert.match(source, /PermanentSyncItemError/);
    assert.doesNotMatch(source, /item\.payload as (UserProfile|Habit|HabitCompletion|Goal|ActivityLog|string)/);
  }
});

test('firebase bulk save paths queue normalized payloads only', () => {
  const goalSource = readProjectFile('repositories/firebase/goalRepository.firebase.ts');
  const activitySource = readProjectFile('repositories/firebase/activityRepository.firebase.ts');
  const habitSource = readProjectFile('repositories/firebase/habitRepository.firebase.ts');

  assert.match(goalSource, /const normalizedGoals = normalizeGoals\(goals\);/);
  assert.match(goalSource, /for \(const goal of normalizedGoals\)/);
  assert.doesNotMatch(goalSource, /for \(const goal of goals\)/);

  assert.match(activitySource, /const normalizedEntries = normalizeActivities\(entries\);/);
  assert.match(activitySource, /for \(const entry of normalizedEntries\)/);
  assert.doesNotMatch(activitySource, /for \(const entry of entries\)/);

  assert.match(habitSource, /const normalizedHabits = normalizeHabits\(habits\);/);
  assert.match(habitSource, /for \(const habit of normalizedHabits\)/);
  assert.doesNotMatch(habitSource, /for \(const habit of habits\)/);
  assert.match(habitSource, /const normalizedCompletions = normalizeHabitCompletions\(completions\);/);
  assert.match(habitSource, /for \(const completion of normalizedCompletions\)/);
  assert.doesNotMatch(habitSource, /for \(const completion of completions\)/);
});

test('firebase delete paths validate ids before local mutation and sync enqueue', () => {
  const files = [
    'repositories/firebase/goalRepository.firebase.ts',
    'repositories/firebase/activityRepository.firebase.ts',
    'repositories/firebase/habitRepository.firebase.ts',
  ];

  const commonSync = readProjectFile('repositories/firebase/commonSync.ts');
  assert.match(commonSync, /export function requireQueuedId/);
  assert.match(commonSync, /return payload\.trim\(\);/);

  for (const file of files) {
    const source = readProjectFile(file);
    assert.match(source, /function requireRepositoryId\(id: string, label: string\): string/);
    assert.match(source, /id must be a non-empty string/);
    assert.match(source, /requireQueuedId/);
    assert.match(source, /const normalizedId = requireRepositoryId/);
  }

  const goalSource = readProjectFile('repositories/firebase/goalRepository.firebase.ts');
  assert.match(goalSource, /goalLocalRepository\.deleteGoal\(normalizedId\)/);
  assert.doesNotMatch(goalSource, /goalLocalRepository\.deleteGoal\(id\)/);
  assert.match(goalSource, /enqueueSyncItem\('goals', 'deleteGoal', normalizedId\)/);

  const activitySource = readProjectFile('repositories/firebase/activityRepository.firebase.ts');
  assert.match(activitySource, /activityLocalRepository\.deleteActivity\(normalizedId\)/);
  assert.doesNotMatch(activitySource, /activityLocalRepository\.deleteActivity\(id\)/);
  assert.match(activitySource, /enqueueSyncItem\('activities', 'deleteActivity', normalizedId\)/);

  const habitSource = readProjectFile('repositories/firebase/habitRepository.firebase.ts');
  assert.match(habitSource, /habitLocalRepository\.deleteHabit\(normalizedId\)/);
  assert.doesNotMatch(habitSource, /habitLocalRepository\.deleteHabit\(id\)/);
  assert.match(habitSource, /habitLocalRepository\.unmarkHabitComplete\(normalizedId\)/);
  assert.match(habitSource, /queueOrDeleteHabitInBackground\(normalizedId\)/);
  assert.match(habitSource, /queueOrRemoveCompletionInBackground\(normalizedId\)/);
});
