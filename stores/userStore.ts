// User profile & preferences store
import type { UserProfile, Intention } from '../types/models';

const USER_PROFILE_KEY = 'kaarma_user_profile';
const ONBOARDING_KEY = 'kaarma_onboarding_completed';
const DISPLAY_NAME_KEY = 'kaarma_display_name';
const INTENTIONS_KEY = 'kaarma_selected_intentions';

export async function getUserProfile(): Promise<UserProfile | null> {
  const { storage } = await import('../storage/asyncStorage');
  return storage.getItem<UserProfile>(USER_PROFILE_KEY);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(USER_PROFILE_KEY, profile);
}

export async function updateDisplayName(name: string): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(DISPLAY_NAME_KEY, name);
  // Also update in profile
  const profile = await getUserProfile();
  if (profile) {
    await saveUserProfile({ ...profile, displayName: name });
  }
}

export async function getDisplayName(): Promise<string> {
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<string>(DISPLAY_NAME_KEY)) ?? 'User';
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function isOnboardingCompleted(): Promise<boolean> {
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<boolean>(ONBOARDING_KEY)) === true;
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(ONBOARDING_KEY, completed);
}

// ─── Intentions ──────────────────────────────────────────────────────────────

export async function getSelectedIntentions(): Promise<Intention[]> {
  const { storage } = await import('../storage/asyncStorage');
  return (await storage.getItem<Intention[]>(INTENTIONS_KEY)) ?? [];
}

export async function saveSelectedIntentions(intentions: Intention[]): Promise<void> {
  const { storage } = await import('../storage/asyncStorage');
  await storage.setItem(INTENTIONS_KEY, intentions);
}
