import { Alert } from 'react-native';
import { ensureJournalUnlocked } from '@/services/journalSecurity';

interface RouterLike {
  push: (href: any) => void;
}

interface JournalAccessOptions {
  router: RouterLike;
  onCancelled?: () => void;
  onUnavailableBack?: () => void;
}

const JOURNAL_LOCK_UNAVAILABLE_MESSAGE =
  'Journal lock is enabled, but this device has no biometric or passcode setup. Configure device authentication, or disable journal lock in Privacy & Security.';

export async function requestJournalAccess({
  router,
  onCancelled,
  onUnavailableBack,
}: JournalAccessOptions): Promise<boolean> {
  const unlockResult = await ensureJournalUnlocked();

  if (unlockResult === 'granted' || unlockResult === 'not_required') {
    return true;
  }

  if (unlockResult === 'cancelled') {
    onCancelled?.();
    return false;
  }

  Alert.alert(
    'Journal Lock Unavailable',
    JOURNAL_LOCK_UNAVAILABLE_MESSAGE,
    [
      {
        text: 'Privacy & Security',
        onPress: () => router.push('/profile/privacy-security' as any),
      },
      onUnavailableBack
        ? {
            text: 'Back',
            style: 'cancel',
            onPress: onUnavailableBack,
          }
        : {
            text: 'Not now',
            style: 'cancel',
          },
    ],
  );

  return false;
}

export async function navigateWithJournalAccess(
  router: RouterLike,
  href: string,
): Promise<void> {
  const granted = await requestJournalAccess({ router });
  if (!granted) return;
  router.push(href as any);
}
