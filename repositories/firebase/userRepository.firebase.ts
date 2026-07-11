import type { UserProfile } from '@/types/models';
import {
  normalizeDisplayName,
  normalizeSelectedIntentions,
  normalizeUserProfile,
} from '@/repositories/userNormalization';
import type { UserRepository } from '@/repositories/interfaces/userRepository';
import { userLocalRepository } from '@/repositories/local/userRepository.local';
import { getCloudContext, stripUndefined, toIsoString, withUpdatedAt } from './common';
import { createRefreshGuard } from './commonSync';
import { pickNewerByUpdatedAt } from './mergeByUpdatedAt';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { enqueueSyncItem, flushSyncQueue, PermanentSyncItemError } from '@/services/sync/syncQueue';
import { captureMessage } from '@/services/observability';

function profileDocRef(uid: string): string {
  return `users/${uid}`;
}

function requireQueuedProfile(payload: unknown): UserProfile {
  const profile = normalizeUserProfile(payload);
  if (!profile) {
    throw new PermanentSyncItemError('queued profile payload is invalid');
  }
  return profile;
}

export async function flushUserQueue(): Promise<void> {
  await flushSyncQueue('user', async (item) => {
    const context = await getCloudContext();
    if (!context) {
      throw new Error('cloud context unavailable');
    }

    if (item.action === 'setProfile') {
      const payload = requireQueuedProfile(item.payload);
      const ref = doc(context.db, profileDocRef(context.uid));
      await setDoc(ref, stripUndefined(withUpdatedAt({ ...payload })), { merge: true });
      return;
    }

    throw new PermanentSyncItemError(`unsupported user sync action "${item.action}"`);
  });
}

export const userFirebaseRepository: UserRepository = {
  async getCurrentUserId() {
    const context = await getCloudContext();
    return context?.uid ?? null;
  },

  async getUserProfile() {
    const localProfile = await userLocalRepository.getUserProfile();
    refreshUserProfileFromCloudInBackground();
    return localProfile;
  },

  async saveUserProfile(profile) {
    const normalizedProfile = normalizeUserProfile(profile);
    if (!normalizedProfile) {
      throw new Error('Cannot save malformed user profile.');
    }

    await userLocalRepository.saveUserProfile(normalizedProfile);
    const context = await getCloudContext();
    if (!context) {
      const stamped = withUpdatedAt({ ...normalizedProfile });
      await userLocalRepository.saveUserProfile(stamped);
      await enqueueSyncItem('user', 'setProfile', stamped);
      return;
    }

    const payload = withUpdatedAt({
      ...normalizedProfile,
      userId: context.uid,
      createdAt: toIsoString(new Date()),
    });

    await userLocalRepository.saveUserProfile({
      ...normalizedProfile,
      updatedAt: payload.updatedAt,
    });

    const ref = doc(context.db, profileDocRef(context.uid));
    try {
      await setDoc(ref, stripUndefined(payload), { merge: true });
      await flushUserQueue();
    } catch (error) {
      captureMessage('user cloud write failed; enqueueing', 'warning', {
        action: 'setProfile',
        error: String(error),
      });
      await enqueueSyncItem('user', 'setProfile', {
        ...normalizedProfile,
        updatedAt: payload.updatedAt,
      });
    }
  },

  async updateDisplayName(name) {
    const normalizedName = normalizeDisplayName(name);
    await userLocalRepository.updateDisplayName(normalizedName);
    const profile = await userLocalRepository.getUserProfile();
    if (!profile) return;
    await this.saveUserProfile({ ...profile, displayName: normalizedName });
  },

  async getDisplayName() {
    return userLocalRepository.getDisplayName();
  },

  async isOnboardingCompleted() {
    return userLocalRepository.isOnboardingCompleted();
  },

  async setOnboardingCompleted(completed) {
    const normalizedCompleted = completed === true;
    await userLocalRepository.setOnboardingCompleted(normalizedCompleted);
    const profile = await userLocalRepository.getUserProfile();
    if (profile) {
      await this.saveUserProfile({ ...profile, onboardingCompleted: normalizedCompleted });
    }
  },

  async getSelectedIntentions() {
    return userLocalRepository.getSelectedIntentions();
  },

  async saveSelectedIntentions(intentions) {
    const normalizedIntentions = normalizeSelectedIntentions(intentions);
    await userLocalRepository.saveSelectedIntentions(normalizedIntentions);
    const profile = await userLocalRepository.getUserProfile();
    if (profile) {
      await this.saveUserProfile({ ...profile, selectedIntentions: normalizedIntentions });
    }
  },
};

const userProfileRefreshGuard = createRefreshGuard(
  'User profile cloud refresh failed; keeping local cache.',
);

function refreshUserProfileFromCloudInBackground(): void {
  userProfileRefreshGuard.run(async () => {
    const context = await getCloudContext();
    if (!context) return;

    await flushUserQueue();

    const ref = doc(context.db, profileDocRef(context.uid));
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const remoteProfile: UserProfile = {
      displayName: typeof data.displayName === 'string' ? data.displayName : 'User',
      email: typeof data.email === 'string' ? data.email : '',
      avatar: typeof data.avatar === 'string' ? data.avatar : null,
      bio: typeof data.bio === 'string' ? data.bio : '',
      onboardingCompleted: data.onboardingCompleted === true,
      selectedIntentions: normalizeSelectedIntentions(data.selectedIntentions),
      updatedAt: data.updatedAt != null ? toIsoString(data.updatedAt) : undefined,
    };

    const localProfile = await userLocalRepository.getUserProfile();
    const profile = pickNewerByUpdatedAt(localProfile, remoteProfile) ?? remoteProfile;

    await userLocalRepository.saveUserProfile(profile);
    await userLocalRepository.updateDisplayName(profile.displayName);
    await userLocalRepository.setOnboardingCompleted(profile.onboardingCompleted);
    await userLocalRepository.saveSelectedIntentions(profile.selectedIntentions);
  });
}
