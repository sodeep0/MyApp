import { storage } from '@/storage/asyncStorage';
import type { Habit, HabitCompletion } from '@/types/models';
import { generateUUID } from '@/stores/baseStore';
import type { HabitRepository } from '@/repositories/interfaces/habitRepository';

const HABITS_KEY = 'kaarma_habits';
const COMPLETIONS_KEY = 'kaarma_habit_completions';

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function getAllCompletions(): Promise<HabitCompletion[]> {
  return (await storage.getItem<HabitCompletion[]>(COMPLETIONS_KEY)) ?? [];
}

export const habitLocalRepository: HabitRepository = {
  async getAllHabits() {
    return (await storage.getItem<Habit[]>(HABITS_KEY)) ?? [];
  },

  async getHabitById(id) {
    const habits = await this.getAllHabits();
    return habits.find((h) => h.id === id);
  },

  async saveHabits(habits) {
    await storage.setItem(HABITS_KEY, habits);
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
    const updatedHabits = [...habits, newHabit];
    await this.saveHabits(updatedHabits);
    return updatedHabits;
  },

  async updateHabit(id, updates) {
    const habits = await this.getAllHabits();
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    habits[idx] = { ...habits[idx], ...updates };
    await this.saveHabits(habits);
    return habits[idx];
  },

  async deleteHabit(id) {
    const habits = await this.getAllHabits();
    await this.saveHabits(habits.filter((h) => h.id !== id));
    const all = await getAllCompletions();
    await storage.setItem(
      COMPLETIONS_KEY,
      all.filter((c) => c.habitId !== id),
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
    await storage.setItem(COMPLETIONS_KEY, completions);
  },

  async markHabitComplete(habitId) {
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
    const all = await getAllCompletions();
    const today = todayStr();
    await storage.setItem(
      COMPLETIONS_KEY,
      all.filter((c) => !(c.habitId === habitId && c.completedDate === today)),
    );
  },
};
