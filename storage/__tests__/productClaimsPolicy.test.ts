import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

test('onboarding does not claim native app blocking is implemented', () => {
  const source = readProjectFile('app/onboarding/permissions.tsx');

  assert.doesNotMatch(source, /block them when your limit is reached/i);
  assert.match(source, /local app limits and focus-session planning/);
});

test('premium screen labels the mock subscription flow as a preview', () => {
  const source = readProjectFile('app/premium/index.tsx');

  assert.doesNotMatch(source, /Start 7-Day Free Trial/);
  assert.doesNotMatch(source, /7-day free trial included/);
  assert.doesNotMatch(source, /Hard app blocking/);
  assert.doesNotMatch(source, /Scheduled blocking/);
  assert.doesNotMatch(source, /scheduling tools/i);
  assert.doesNotMatch(source, /Photo attachments in journal/);
  assert.doesNotMatch(source, /goals & templates/i);
  assert.doesNotMatch(source, /Streak shield/i);
  assert.doesNotMatch(source, /restore missed days/i);
  assert.doesNotMatch(source, /Save 40%/);
  assert.doesNotMatch(source, /Restore Purchases/);
  assert.doesNotMatch(source, /Unlock everything/);
  assert.doesNotMatch(source, /Cloud backup & data export/);
  assert.doesNotMatch(source, /Cloud-eligible sync foundations and data export/);
  assert.doesNotMatch(source, /Expanded streak insights/);
  assert.match(source, /Enable Premium Preview/);
  assert.match(source, /Premium Preview/);
  assert.match(source, /billing is still mocked/);
  assert.match(source, /Refresh Preview/);
  assert.match(source, /Unlimited habit history/);
  assert.match(source, /Production billing is not connected yet/);
});

test('screen-time dashboard copy does not imply native blocking enforcement', () => {
  const source = readProjectFile('app/(tabs)/screen-time/index.tsx');

  assert.doesNotMatch(source, /Lock distractions/i);
  assert.doesNotMatch(source, />Blocked Apps</);
  assert.match(source, /Plan a focused stretch/);
  assert.match(source, /Focus App Plan/);
});

test('shared premium gate copy does not imply native blocking enforcement', () => {
  const source = readProjectFile('constants/featureLimits.ts');

  assert.doesNotMatch(source, /hard app blocking/i);
  assert.doesNotMatch(source, /scheduled blocking/i);
  assert.match(source, /blocked-app planning/);
});
