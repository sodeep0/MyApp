// User profile & preferences store
import type { UserProfile, Intention } from '../types/models';
import { getUserRepository } from '@/repositories/factory';
export { DISPLAY_NAME_KEY } from '@/repositories/local/userRepository.local';

function repo() {
  return getUserRepository();
}

export async function getUserProfile(): Promise<UserProfile | null> {
  return repo().getUserProfile();
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await repo().saveUserProfile(profile);
}

export async function updateDisplayName(name: string): Promise<void> {
  await repo().updateDisplayName(name);
}

export async function getDisplayName(): Promise<string> {
  return repo().getDisplayName();
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function isOnboardingCompleted(): Promise<boolean> {
  return repo().isOnboardingCompleted();
}

export async function setOnboardingCompleted(completed: boolean): Promise<void> {
  await repo().setOnboardingCompleted(completed);
}

// ─── Intentions ──────────────────────────────────────────────────────────────

export async function getSelectedIntentions(): Promise<Intention[]> {
  return repo().getSelectedIntentions();
}

export async function saveSelectedIntentions(intentions: Intention[]): Promise<void> {
  await repo().saveSelectedIntentions(intentions);
}
