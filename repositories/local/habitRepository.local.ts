import { storage } from '@/storage/asyncStorage';
import type { Habit, HabitCompletion } from '@/types/models';
import { generateUUID } from '@/stores/baseStore';
import type { HabitRepository } from '@/repositories/interfaces/habitRepository';
import { normalizeHabitCompletions, normalizeHabits } from '@/repositories/habitNormalization';

const HABITS_KEY = 'kaarma_habits';
const COMPLETIONS_KEY = 'kaarma_habit_completions';

function requireValidHabit(habit: Habit, message: string): Habit {
  const [normalizedHabit] = normalizeHabits([habit]);
  if (!normalizedHabit) {
    throw new Error(message);
  }
  return normalizedHabit;
}

function requireHabitId(id: string): string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Habit id must be a non-empty string.');
  }
  return id.trim();
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function getAllCompletions(): Promise<HabitCompletion[]> {
  return normalizeHabitCompletions(await storage.getItem<unknown>(COMPLETIONS_KEY, []));
}

export async function clearHabitLocalCache(): Promise<void> {
  await Promise.all([
    storage.removeItem(HABITS_KEY),
    storage.removeItem(COMPLETIONS_KEY),
  ]);
}

export const habitLocalRepository: HabitRepository = {
  async getAllHabits() {
    return normalizeHabits(await storage.getItem<unknown>(HABITS_KEY, []));
  },

  async getHabitById(id) {
    const habits = await this.getAllHabits();
    return habits.find((h) => h.id === id);
  },

  async saveHabits(habits) {
    await storage.setItem(HABITS_KEY, normalizeHabits(habits));
  },

  async addHabit(data) {
    const habits = await this.getAllHabits();
    const newHabit: Habit = {
      ...data,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
      isArchived: false,
      streakShieldsRemaining: 0,
    };
    const normalizedHabit = requireValidHabit(newHabit, 'Habit data must be valid before saving.');
    const updatedHabits = [...habits, normalizedHabit];
    await this.saveHabits(updatedHabits);
    return updatedHabits;
  },

  async updateHabit(id, updates) {
    const habits = await this.getAllHabits();
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    habits[idx] = requireValidHabit(
      { ...habits[idx], ...updates },
      'Habit update would create invalid habit data.',
    );
    await this.saveHabits(habits);
    return habits[idx];
  },

  async deleteHabit(id) {
    const normalizedId = requireHabitId(id);
    const habits = await this.getAllHabits();
    await this.saveHabits(habits.filter((h) => h.id !== normalizedId));
    const all = await getAllCompletions();
    await storage.setItem(
      COMPLETIONS_KEY,
      all.filter((c) => c.habitId !== normalizedId),
    );
  },

  async getCompletionsForHabit(habitId) {
    const all = await getAllCompletions();
    return all.filter((c) => c.habitId === habitId);
  },

  async getTodayCompletionsForHabit(habitId) {
    const completions = await this.getCompletionsForHabit(habitId);
    const today = todayStr();
    return completions.filter((c) => c.completedDate === today);
  },

  async saveCompletions(completions) {
    await storage.setItem(COMPLETIONS_KEY, normalizeHabitCompletions(completions));
  },

  async markHabitComplete(habitId) {
    const habit = await this.getHabitById(habitId);
    if (!habit) {
      throw new Error('Habit must exist before it can be completed.');
    }

    const all = await getAllCompletions();
    const today = todayStr();
    const exists = all.find((c) => c.habitId === habitId && c.completedDate === today);
    if (exists) return exists;

    const completion: HabitCompletion = {
      id: generateUUID(),
      habitId,
      completedDate: today,
      completedAt: new Date().toISOString(),
    };
    await storage.setItem(COMPLETIONS_KEY, [...all, completion]);
    return completion;
  },

  async unmarkHabitComplete(habitId) {
    const normalizedId = requireHabitId(habitId);
    const all = await getAllCompletions();
    const today = todayStr();
    await storage.setItem(
      COMPLETIONS_KEY,
      all.filter((c) => !(c.habitId === normalizedId && c.completedDate === today)),
    );
  },
};
