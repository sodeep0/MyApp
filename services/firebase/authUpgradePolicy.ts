/**
 * Pure helpers for anonymous → registered account upgrade decisions.
 * Kept free of Firebase SDK so policy can be unit-tested.
 */

export type AuthUpgradeStrategy = 'link' | 'signIn';

export function shouldAttemptAnonymousLink(isAnonymous: boolean | undefined | null): boolean {
  return isAnonymous === true;
}

/**
 * After a failed link attempt, decide whether to fall back to normal sign-in.
 * Existing accounts cannot be linked onto the anonymous UID.
 */
export function shouldFallbackToSignInAfterLinkFailure(errorCode: string | undefined): boolean {
  return (
    errorCode === 'auth/credential-already-in-use'
    || errorCode === 'auth/email-already-in-use'
    || errorCode === 'auth/provider-already-linked'
  );
}

export function resolveAuthUpgradeStrategy(
  isAnonymous: boolean | undefined | null,
): AuthUpgradeStrategy {
  return shouldAttemptAnonymousLink(isAnonymous) ? 'link' : 'signIn';
}

export function getFirebaseErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}
