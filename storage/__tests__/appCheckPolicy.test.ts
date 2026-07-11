import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  isAppCheckEnabledByEnv,
  isAppCheckInitPathAvailable,
  resolveAppCheckInitPath,
} from '../../services/firebase/appCheckPolicy';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

test('App Check env gate is false when EXPO_PUBLIC_FIREBASE_APP_CHECK is not true', () => {
  assert.equal(isAppCheckEnabledByEnv('false'), false);
  assert.equal(isAppCheckEnabledByEnv(undefined), false);
  assert.equal(isAppCheckEnabledByEnv('true'), true);
  assert.equal(
    resolveAppCheckInitPath({
      enabled: false,
      platform: 'web',
      siteKey: 'x',
    }),
    'disabled',
  );
});

test('App Check web path uses ReCaptchaV3 when site key is present', () => {
  assert.equal(
    resolveAppCheckInitPath({
      enabled: true,
      platform: 'web',
      siteKey: 'test-site-key',
    }),
    'recaptcha-v3',
  );
  assert.equal(
    resolveAppCheckInitPath({
      enabled: true,
      platform: 'web',
      siteKey: undefined,
    }),
    'custom-warn-only',
  );
});

test('App Check native path uses CustomProvider debug token when set', () => {
  assert.equal(
    resolveAppCheckInitPath({
      enabled: true,
      platform: 'ios',
      debugToken: 'debug-token',
    }),
    'custom-debug-token',
  );
  assert.equal(
    resolveAppCheckInitPath({
      enabled: true,
      platform: 'android',
      debugToken: undefined,
    }),
    'custom-warn-only',
  );
});

test('isAppCheckInitPathAvailable reflects flag gating', () => {
  assert.equal(isAppCheckInitPathAvailable('true'), true);
  assert.equal(isAppCheckInitPathAvailable('false'), false);
});

test('firebase app source wires App Check providers and env gate', () => {
  const appSource = readProjectFile('services/firebase/app.ts');
  const policySource = readProjectFile('services/firebase/appCheckPolicy.ts');

  assert.match(appSource, /EXPO_PUBLIC_FIREBASE_APP_CHECK/);
  assert.match(appSource, /ReCaptchaV3Provider/);
  assert.match(appSource, /CustomProvider/);
  assert.match(appSource, /EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN/);
  assert.match(appSource, /isAppCheckInitPathAvailable/);
  assert.match(appSource, /resolveAppCheckInitPath/);
  assert.match(policySource, /recaptcha-v3/);
  assert.match(policySource, /custom-debug-token/);
});
