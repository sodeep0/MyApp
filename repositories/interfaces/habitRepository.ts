import type { Habit, HabitCompletion } from '@/types/models';

export interface HabitRepository {
  getAllHabits(): Promise<Habit[]>;
  getHabitById(id: string): Promise<Habit | undefined>;
  saveHabits(habits: Habit[]): Promise<void>;
  addHabit(data: Omit<Habit, 'id' | 'createdAt' | 'isArchived' | 'streakShieldsRemaining'>): Promise<Habit[]>;
  updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null>;
  deleteHabit(id: string): Promise<void>;
  getCompletionsForHabit(habitId: string): Promise<HabitCompletion[]>;
  getTodayCompletionsForHabit(habitId: string): Promise<HabitCompletion[]>;
  saveCompletions(completions: HabitCompletion[]): Promise<void>;
  markHabitComplete(habitId: string): Promise<HabitCompletion>;
  unmarkHabitComplete(habitId: string): Promise<void>;
}
