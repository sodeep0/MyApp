import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const projectRoot = join(__dirname, '..', '..');

function readProjectFile(path: string): string {
  return readFileSync(join(projectRoot, path), 'utf8');
}

test('screen-time dashboard routes focus and blocking through shared premium gates', () => {
  const source = readProjectFile('app/(tabs)/screen-time/index.tsx');

  assert.match(source, /import \{ PremiumLockedBanner \}/);
  assert.match(source, /import \{ getPremiumFeatureGate \}/);
  assert.match(source, /useSubscription\(\)/);
  assert.match(source, /getPremiumFeatureGate\(\s*"focusAndBlocking",\s*isPremium,\s*\)/);
  assert.match(source, /getPremiumFeatureGate\("focusSessions", isPremium\)/);
  assert.match(source, /getPremiumFeatureGate\("appBlocking", isPremium\)/);
  assert.match(source, /focusAndBlockingGate\.locked/);
});

test('free users cannot start focus sessions or toggle app blocking directly', () => {
  const source = readProjectFile('app/(tabs)/screen-time/index.tsx');

  assert.match(
    source,
    /focusSessionsGate\.locked\s*\?\s*handlePremiumUpgrade\s*:\s*\(\) => handleStartFocus\(duration\.minutes\)/,
  );
  assert.match(
    source,
    /if \(!appBlockingGate\.locked\) {\s*toggleBlockedApp\(app\.packageName\);\s*return;\s*}\s*handlePremiumUpgrade\(\);/,
  );
});

test('screen-time service reports use normalized local settings and native values', () => {
  const source = readProjectFile('services/screenTimeService.ts');

  assert.doesNotMatch(source, /storage\.getItem<Record<string, number>>\(SCREEN_TIME_APP_LIMITS_KEY/);
  assert.match(source, /import \{ getAppLimits \} from '@\/services\/screenTimeState';/);
  assert.match(source, /const limits = await getAppLimits\(\);/);
  assert.match(source, /function normalizeUsageStat/);
  assert.match(source, /Number\.isFinite\(stat\.totalTimeInForeground\)/);
});
