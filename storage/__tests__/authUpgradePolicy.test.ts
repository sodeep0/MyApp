import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getFirebaseErrorCode,
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

test('link failures for existing credentials fall back to sign-in', () => {
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/credential-already-in-use'), true);
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/email-already-in-use'), true);
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/provider-already-linked'), true);
  assert.equal(shouldFallbackToSignInAfterLinkFailure('auth/invalid-credential'), false);
  assert.equal(shouldFallbackToSignInAfterLinkFailure(undefined), false);
});

test('getFirebaseErrorCode reads Firebase-style error codes', () => {
  assert.equal(getFirebaseErrorCode({ code: 'auth/email-already-in-use' }), 'auth/email-already-in-use');
  assert.equal(getFirebaseErrorCode(new Error('nope')), undefined);
  assert.equal(getFirebaseErrorCode(null), undefined);
});
