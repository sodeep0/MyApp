import type { Intention, UserProfile } from '@/types/models';

export interface UserRepository {
  getCurrentUserId(): Promise<string | null>;
  getUserProfile(): Promise<UserProfile | null>;
  saveUserProfile(profile: UserProfile): Promise<void>;
  updateDisplayName(name: string): Promise<void>;
  getDisplayName(): Promise<string>;
  isOnboardingCompleted(): Promise<boolean>;
  setOnboardingCompleted(completed: boolean): Promise<void>;
  getSelectedIntentions(): Promise<Intention[]>;
  saveSelectedIntentions(intentions: Intention[]): Promise<void>;
}
