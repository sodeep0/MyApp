import { storage } from '@/storage/asyncStorage';
import type { Intention, UserProfile } from '@/types/models';
import type { UserRepository } from '@/repositories/interfaces/userRepository';

const USER_PROFILE_KEY = 'kaarma_user_profile';
const ONBOARDING_KEY = 'kaarma_onboarding_completed';
const DISPLAY_NAME_KEY = 'kaarma_display_name';
const INTENTIONS_KEY = 'kaarma_selected_intentions';

async function readProfile(): Promise<UserProfile | null> {
  return storage.getItem<UserProfile>(USER_PROFILE_KEY);
}

async function writeProfile(profile: UserProfile): Promise<void> {
  await storage.setItem(USER_PROFILE_KEY, profile);
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
    await storage.setItem(DISPLAY_NAME_KEY, name);
    const profile = await readProfile();
    if (profile) {
      await writeProfile({ ...profile, displayName: name });
    }
  },

  async getDisplayName() {
    return (await storage.getItem<string>(DISPLAY_NAME_KEY)) ?? 'User';
  },

  async isOnboardingCompleted() {
    return (await storage.getItem<boolean>(ONBOARDING_KEY)) === true;
  },

  async setOnboardingCompleted(completed) {
    await storage.setItem(ONBOARDING_KEY, completed);
  },

  async getSelectedIntentions() {
    return (await storage.getItem<Intention[]>(INTENTIONS_KEY)) ?? [];
  },

  async saveSelectedIntentions(intentions) {
    await storage.setItem(INTENTIONS_KEY, intentions);
  },
};
