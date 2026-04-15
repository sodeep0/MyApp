import { isFirebaseConfigured } from '@/services/firebase/app';
import type { UserRepository } from '@/repositories/interfaces/userRepository';
import type { HabitRepository } from '@/repositories/interfaces/habitRepository';
import type { GoalRepository } from '@/repositories/interfaces/goalRepository';
import type { ActivityRepository } from '@/repositories/interfaces/activityRepository';
import { userLocalRepository } from '@/repositories/local/userRepository.local';
import { habitLocalRepository } from '@/repositories/local/habitRepository.local';
import { goalLocalRepository } from '@/repositories/local/goalRepository.local';
import { activityLocalRepository } from '@/repositories/local/activityRepository.local';
import { userFirebaseRepository } from '@/repositories/firebase/userRepository.firebase';
import { habitFirebaseRepository } from '@/repositories/firebase/habitRepository.firebase';
import { goalFirebaseRepository } from '@/repositories/firebase/goalRepository.firebase';
import { activityFirebaseRepository } from '@/repositories/firebase/activityRepository.firebase';

function cloudSyncEnabled(): boolean {
  if (!isFirebaseConfigured()) return false;
  return process.env.EXPO_PUBLIC_ENABLE_CLOUD_SYNC !== 'false';
}

export function getUserRepository(): UserRepository {
  return cloudSyncEnabled() ? userFirebaseRepository : userLocalRepository;
}

export function getHabitRepository(): HabitRepository {
  return cloudSyncEnabled() ? habitFirebaseRepository : habitLocalRepository;
}

export function getGoalRepository(): GoalRepository {
  return cloudSyncEnabled() ? goalFirebaseRepository : goalLocalRepository;
}

export function getActivityRepository(): ActivityRepository {
  return cloudSyncEnabled() ? activityFirebaseRepository : activityLocalRepository;
}
