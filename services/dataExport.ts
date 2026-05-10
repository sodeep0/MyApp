import { getAllActivities } from '@/stores/activityStore';
import { getAllBadHabits, getAllUrgeEvents } from '@/stores/badHabitStore';
import { getAllGoals } from '@/stores/goalStore';
import { getAllHabits, getCompletionsForHabit } from '@/stores/habitStore';
import { getAllJournalEntries } from '@/stores/journalStore';
import { getUserProfile } from '@/stores/userStore';
import { getScreenTimeExportState, type ScreenTimeExportState } from '@/services/screenTimeState';
import type {
  ActivityLog,
  BadHabit,
  Goal,
  Habit,
  HabitCompletion,
  JournalEntry,
  UrgeEvent,
  UserProfile,
} from '@/types/models';

export interface KaarmaExportPayload {
  app: 'Kaarma';
  exportVersion: 1;
  exportedAt: string;
  privacy: {
    journal: 'included from local-only device storage';
    badHabits: 'included from local-only device storage';
    screenTime: 'included from local device settings';
    cloudEligibleModules: ['profile', 'habits', 'goals', 'activities'];
  };
  warnings: string[];
  data: {
    profile: UserProfile | null;
    habits: Habit[];
    habitCompletions: HabitCompletion[];
    goals: Goal[];
    activities: ActivityLog[];
    journalEntries: JournalEntry[];
    badHabits: BadHabit[];
    urgeEvents: UrgeEvent[];
    screenTime: ScreenTimeExportState;
  };
}

export async function buildExportPayload(now: Date = new Date()): Promise<KaarmaExportPayload> {
  const [
    profile,
    habits,
    goals,
    activities,
    journalEntries,
    badHabits,
    urgeEvents,
    screenTime,
  ] = await Promise.all([
    getUserProfile(),
    getAllHabits(),
    getAllGoals(),
    getAllActivities(),
    getAllJournalEntries(),
    getAllBadHabits(),
    getAllUrgeEvents(),
    getScreenTimeExportState(now.getTime()),
  ]);

  const completionResults = await Promise.allSettled(
    habits.map(async (habit) => ({
      habitId: habit.id,
      completions: await getCompletionsForHabit(habit.id),
    })),
  );
  const warnings: string[] = [];
  const habitCompletions = completionResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value.completions;
    }

    const habitId = habits[index]?.id ?? 'unknown';
    warnings.push(`Habit completions for ${habitId} could not be included.`);
    return [];
  });

  return {
    app: 'Kaarma',
    exportVersion: 1,
    exportedAt: now.toISOString(),
    privacy: {
      journal: 'included from local-only device storage',
      badHabits: 'included from local-only device storage',
      screenTime: 'included from local device settings',
      cloudEligibleModules: ['profile', 'habits', 'goals', 'activities'],
    },
    warnings,
    data: {
      profile,
      habits,
      habitCompletions,
      goals,
      activities,
      journalEntries,
      badHabits,
      urgeEvents,
      screenTime,
    },
  };
}
