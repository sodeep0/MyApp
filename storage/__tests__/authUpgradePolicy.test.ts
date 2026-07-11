import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthUpgradeRequiresChoiceError,
  getFirebaseErrorCode,
  isCredentialCollisionError,
  resolveAuthUpgradeStrategy,
  shouldAttemptAnonymousLink,
  shouldFallbackToSignInAfterLinkFailure,
} from '../../services/firebase/authUpgradePolicy';

test('anonymous users should attempt credential linking', () => {
  assert.equal(shouldAttemptAnonymousLink(true), true);
  assert.equal(resolveAuthUpgradeStrategy(true), 'link');
});

test('non-anonymous users should sign in normally', () => {
  assert.equal(shouldAttemptAnonymousLink(false), false);
  assert.equal(shouldAttemptAnonymousLink(null), false);
  assert.equal(shouldAttemptAnonymousLink(undefined), false);
  assert.equal(resolveAuthUpgradeStrategy(false), 'signIn');
});

test('credential collision codes are identified', () => {
  assert.equal(isCredentialCollisionError('auth/credential-already-in-use'), true);
  assert.equal(isCredentialCollisionError('auth/email-already-in-use'), true);
  assert.equal(isCredentialCollisionError('auth/provider-already-linked'), true);
  assert.equal(isCredentialCollisionError('auth/invalid-credential'), false);
  assert.equal(isCredentialCollisionError(undefined), false);
});

test('link failures for existing credentials do not silently fall back to sign-in', () => {
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/credential-already-in-use'), false);
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/email-already-in-use'), false);
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/provider-already-linked'), false);
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/invalid-credential'), false);
  assert.equal(shouldFallbackToSignInAfterLinkFailure(undefined), false);
});

test('collision requires explicit choice via AuthUpgradeRequiresChoiceError', () => {
  assert.equal(
    isCredentialCollisionError('auth/email-already-in-use')
      && !shouldFallbackToSignInAfterLinkFailure('auth/email-already-in-use'),
    true,
  );

  const byThrow = new AuthUpgradeRequiresChoiceError();
  assert.equal(byThrow.name, 'AuthUpgradeRequiresChoiceError');
  assert.equal(byThrow instanceof AuthUpgradeRequiresChoiceError, true);
  assert.match(byThrow.message, /guest cloud data will not transfer/i);
});

test('AuthUpgradeRequiresChoiceError is identifiable via name or instanceof', () => {
  const error: unknown = new AuthUpgradeRequiresChoiceError();
  assert.equal(error instanceof AuthUpgradeRequiresChoiceError, true);
  assert.equal(
    typeof error === 'object'
      && error !== null
      && 'name' in error
      && (error as { name: string }).name === 'AuthUpgradeRequiresChoiceError',
    true,
  );
});

test('getFirebaseErrorCode reads Firebase-style error codes', () => {
  assert.equal(getFirebaseErrorCode({ code: 'auth/email-already-in-use' }), 'auth/email-already-in-use');
  assert.equal(getFirebaseErrorCode(new Error('nope')), undefined);
  assert.equal(getFirebaseErrorCode(null), undefined);
});
