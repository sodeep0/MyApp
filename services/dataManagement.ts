import { clearActivityLocalCache } from '@/repositories/local/activityRepository.local';
import { clearGoalLocalCache } from '@/repositories/local/goalRepository.local';
import { clearHabitLocalCache } from '@/repositories/local/habitRepository.local';
import { clearUserLocalSessionData } from '@/repositories/local/userRepository.local';
import { cancelManagedNotificationsAsync } from '@/services/notifications';
import { resetScreenTimeData } from '@/services/screenTimeService';
import { clearSyncQueue } from '@/services/sync/syncQueue';
import { setStoredPremiumState } from '@/services/subscription';
import { resetSensitiveDataStorage } from '@/storage/secureDataStorage';
import { storage } from '@/storage/asyncStorage';

const ONBOARDING_KEY = 'kaarma_onboarding_completed';
const NOTIFICATION_SETTINGS_KEY = 'kaarma_notification_settings_v1';
const SECURITY_SETTINGS_KEY = 'kaarma_security_settings_v1';
const USER_EMAIL_KEY = 'kaarma_user_email';
const LOGGED_IN_KEY = 'kaarma_logged_in';

type ResetStep = {
  name: string;
  run: () => Promise<void>;
};

function getResetErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function resetLocalAppData(): Promise<void> {
  try {
    await cancelManagedNotificationsAsync();
  } catch (error) {
    console.warn(
      `Failed to cancel managed notifications during local data reset: ${getResetErrorMessage(error)}`,
    );
  }

  const resetSteps: ResetStep[] = [
    { name: 'user session', run: clearUserLocalSessionData },
    { name: 'habit cache', run: clearHabitLocalCache },
    { name: 'goal cache', run: clearGoalLocalCache },
    { name: 'activity cache', run: clearActivityLocalCache },
    { name: 'sync queue', run: clearSyncQueue },
    { name: 'sensitive local data', run: resetSensitiveDataStorage },
    { name: 'screen-time state', run: resetScreenTimeData },
    { name: 'premium state', run: () => setStoredPremiumState(false) },
    { name: 'onboarding state', run: () => storage.removeItem(ONBOARDING_KEY) },
    { name: 'notification settings', run: () => storage.removeItem(NOTIFICATION_SETTINGS_KEY) },
    { name: 'security settings', run: () => storage.removeItem(SECURITY_SETTINGS_KEY) },
    { name: 'user email', run: () => storage.removeItem(USER_EMAIL_KEY) },
    { name: 'logged-in flag', run: () => storage.removeItem(LOGGED_IN_KEY) },
  ];

  const results = await Promise.allSettled(resetSteps.map((step) => step.run()));
  const failures = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') {
      return [];
    }

    return [
      `${resetSteps[index].name}: ${getResetErrorMessage(result.reason)}`,
    ];
  });

  if (failures.length > 0) {
    console.warn(`Local data reset failed for ${failures.join('; ')}`);
    throw new Error(`Local data reset failed for ${failures.map((failure) => failure.split(':')[0]).join(', ')}.`);
  }
}
