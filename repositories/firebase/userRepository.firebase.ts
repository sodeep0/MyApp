import type { Intention, UserProfile } from '@/types/models';
import type { UserRepository } from '@/repositories/interfaces/userRepository';
import { userLocalRepository } from '@/repositories/local/userRepository.local';
import { getCloudContext, stripUndefined, toIsoString, withUpdatedAt } from './common';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { enqueueSyncItem, flushSyncQueue } from '@/services/sync/syncQueue';

function profileDocRef(uid: string): string {
  return `users/${uid}`;
}

export async function flushUserQueue(): Promise<void> {
  await flushSyncQueue('user', async (item) => {
    const context = await getCloudContext();
    if (!context) {
      throw new Error('cloud context unavailable');
    }

    if (item.action === 'setProfile') {
      const payload = item.payload as UserProfile;
      const ref = doc(context.db, profileDocRef(context.uid));
      await setDoc(ref, stripUndefined(withUpdatedAt({ ...payload })), { merge: true });
    }
  });
}

export const userFirebaseRepository: UserRepository = {
  async getCurrentUserId() {
    const context = await getCloudContext();
    return context?.uid ?? null;
  },

  async getUserProfile() {
    const context = await getCloudContext();
    if (!context) {
      return userLocalRepository.getUserProfile();
    }

    await flushUserQueue();

    const ref = doc(context.db, profileDocRef(context.uid));
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return userLocalRepository.getUserProfile();
    }

    const data = snap.data();
    const profile: UserProfile = {
      displayName: typeof data.displayName === 'string' ? data.displayName : 'User',
      email: typeof data.email === 'string' ? data.email : '',
      avatar: typeof data.avatar === 'string' ? data.avatar : null,
      bio: typeof data.bio === 'string' ? data.bio : '',
      onboardingCompleted: data.onboardingCompleted === true,
      selectedIntentions: (Array.isArray(data.selectedIntentions)
        ? data.selectedIntentions
        : []) as Intention[],
    };

    await userLocalRepository.saveUserProfile(profile);
    await userLocalRepository.updateDisplayName(profile.displayName);
    await userLocalRepository.setOnboardingCompleted(profile.onboardingCompleted);
    await userLocalRepository.saveSelectedIntentions(profile.selectedIntentions);
    return profile;
  },

  async saveUserProfile(profile) {
    await userLocalRepository.saveUserProfile(profile);
    const context = await getCloudContext();
    if (!context) {
      await enqueueSyncItem('user', 'setProfile', profile);
      return;
    }

    const payload = withUpdatedAt({
      ...profile,
      userId: context.uid,
      createdAt: toIsoString(new Date()),
    });

    const ref = doc(context.db, profileDocRef(context.uid));
    try {
      await setDoc(ref, stripUndefined(payload), { merge: true });
      await flushUserQueue();
    } catch {
      await enqueueSyncItem('user', 'setProfile', profile);
    }
  },

  async updateDisplayName(name) {
    await userLocalRepository.updateDisplayName(name);
    const profile = await this.getUserProfile();
    if (!profile) return;
    await this.saveUserProfile({ ...profile, displayName: name });
  },

  async getDisplayName() {
    return userLocalRepository.getDisplayName();
  },

  async isOnboardingCompleted() {
    return userLocalRepository.isOnboardingCompleted();
  },

  async setOnboardingCompleted(completed) {
    await userLocalRepository.setOnboardingCompleted(completed);
    const profile = await this.getUserProfile();
    if (profile) {
      await this.saveUserProfile({ ...profile, onboardingCompleted: completed });
    }
  },

  async getSelectedIntentions() {
    return userLocalRepository.getSelectedIntentions();
  },

  async saveSelectedIntentions(intentions) {
    await userLocalRepository.saveSelectedIntentions(intentions);
    const profile = await this.getUserProfile();
    if (profile) {
      await this.saveUserProfile({ ...profile, selectedIntentions: intentions });
    }
  },
};
