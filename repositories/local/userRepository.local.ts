import { storage } from '@/storage/asyncStorage';
import type { Intention, UserProfile } from '@/types/models';
import type { UserRepository } from '@/repositories/interfaces/userRepository';
import {
  normalizeDisplayName,
  normalizeSelectedIntentions,
  normalizeUserProfile,
} from '@/repositories/userNormalization';

const USER_PROFILE_KEY = 'kaarma_user_profile';
const ONBOARDING_KEY = 'kaarma_onboarding_completed';
export const DISPLAY_NAME_KEY = 'kaarma_display_name';
const INTENTIONS_KEY = 'kaarma_selected_intentions';

async function readProfile(): Promise<UserProfile | null> {
  return normalizeUserProfile(await storage.getItem<unknown>(USER_PROFILE_KEY));
}

async function writeProfile(profile: UserProfile): Promise<void> {
  const normalized = normalizeUserProfile(profile);
  if (!normalized) return;

  await storage.setItem(USER_PROFILE_KEY, normalized);
}

export async function clearUserLocalSessionData(): Promise<void> {
  await Promise.all([
    storage.removeItem(USER_PROFILE_KEY),
    storage.removeItem(DISPLAY_NAME_KEY),
    storage.removeItem(INTENTIONS_KEY),
  ]);
}

export const userLocalRepository: UserRepository = {
  async getCurrentUserId() {
    return 'local';
  },

  async getUserProfile() {
    return readProfile();
  },

  async saveUserProfile(profile) {
    await writeProfile(profile);
  },

  async updateDisplayName(name) {
    const normalizedName = normalizeDisplayName(name);
    await storage.setItem(DISPLAY_NAME_KEY, normalizedName);
    const profile = await readProfile();
    if (profile) {
      await writeProfile({ ...profile, displayName: normalizedName });
    }
  },

  async getDisplayName() {
    return normalizeDisplayName(await storage.getItem<unknown>(DISPLAY_NAME_KEY));
  },

  async isOnboardingCompleted() {
    return (await storage.getItem<boolean>(ONBOARDING_KEY)) === true;
  },

  async setOnboardingCompleted(completed) {
    await storage.setItem(ONBOARDING_KEY, completed === true);
  },

  async getSelectedIntentions() {
    return normalizeSelectedIntentions(await storage.getItem<unknown>(INTENTIONS_KEY, []));
  },

  async saveSelectedIntentions(intentions) {
    await storage.setItem(INTENTIONS_KEY, normalizeSelectedIntentions(intentions));
  },
};
