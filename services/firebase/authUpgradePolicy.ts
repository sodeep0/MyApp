/**
 * Pure helpers for anonymous → registered account upgrade decisions.
 * Kept free of Firebase SDK so policy can be unit-tested.
 */

export type AuthUpgradeStrategy = 'link' | 'signIn';

const CREDENTIAL_COLLISION_CODES = new Set([
  'auth/credential-already-in-use',
  'auth/email-already-in-use',
  'auth/provider-already-linked',
]);

/**
 * Thrown when linking an anonymous session collides with an existing account.
 * Callers must ask the user to explicitly continue (guest cloud data will not transfer).
 */
export class AuthUpgradeRequiresChoiceError extends Error {
  constructor(
    message = 'An account already exists for this credential. Continuing signs into that account; guest cloud data will not transfer.',
  ) {
    super(message);
    this.name = 'AuthUpgradeRequiresChoiceError';
  }
}

export function isCredentialCollisionError(code: string | undefined): boolean {
  return typeof code === 'string' && CREDENTIAL_COLLISION_CODES.has(code);
}

export function shouldAttemptAnonymousLink(isAnonymous: boolean | undefined | null): boolean {
  return isAnonymous === true;
}

/**
 * After a failed link attempt, decide whether to fall back to normal sign-in.
 * Credential collisions require explicit user choice — never silent fallback.
 */
export function shouldFallbackToSignInAfterLinkFailure(errorCode: string | undefined): boolean {
  if (isCredentialCollisionError(errorCode)) {
    return false;
  }
  // No other link-failure codes currently allow silent sign-in fallback.
  return false;
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
