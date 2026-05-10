import { Intention, type UserProfile } from '@/types/models';

function normalizeIntentions(value: unknown): Intention[] {
  if (!Array.isArray(value)) return [];

  return value.filter((intention): intention is Intention => (
    Object.values(Intention).includes(intention as Intention)
  ));
}

export function normalizeUserProfile(value: unknown): UserProfile | null {
  if (!value || typeof value !== 'object') return null;

  const profile = value as Partial<UserProfile>;
  if (typeof profile.displayName !== 'string') return null;

  return {
    displayName: normalizeDisplayName(profile.displayName),
    email: typeof profile.email === 'string' ? profile.email : '',
    avatar: typeof profile.avatar === 'string' ? profile.avatar : null,
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    onboardingCompleted: profile.onboardingCompleted === true,
    selectedIntentions: normalizeIntentions(profile.selectedIntentions),
  };
}

export function normalizeSelectedIntentions(value: unknown): Intention[] {
  return normalizeIntentions(value);
}

export function normalizeDisplayName(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : 'User';
}
