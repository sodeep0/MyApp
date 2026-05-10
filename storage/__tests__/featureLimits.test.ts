import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FREE_TIER_LIMITS,
  canEditActivityLog,
  filterHabitHistoryCompletions,
  formatDateOnly,
  getActivityEditDeadline,
  getCountLimitedFeatureGate,
  getHabitHistoryCutoffDate,
  getMaxDateString,
  getPremiumFeatureGate,
} from '../../constants/featureLimits';

test('count-limited gates lock exactly at the free-tier limit', () => {
  const underLimit = getCountLimitedFeatureGate('activeGoals', false, FREE_TIER_LIMITS.ACTIVE_GOALS - 1);
  const atLimit = getCountLimitedFeatureGate('activeGoals', false, FREE_TIER_LIMITS.ACTIVE_GOALS);
  const premiumAtLimit = getCountLimitedFeatureGate('activeGoals', true, FREE_TIER_LIMITS.ACTIVE_GOALS);
  const malformedPremiumAtLimit = getCountLimitedFeatureGate('activeGoals', 'true' as any, FREE_TIER_LIMITS.ACTIVE_GOALS);
  const malformedCount = getCountLimitedFeatureGate('activeGoals', false, Number.NaN);

  assert.equal(underLimit.locked, false);
  assert.equal(underLimit.remaining, 1);
  assert.equal(atLimit.locked, true);
  assert.equal(atLimit.remaining, 0);
  assert.equal(premiumAtLimit.locked, false);
  assert.equal(malformedPremiumAtLimit.locked, true);
  assert.equal(malformedCount.count, 0);
  assert.equal(malformedCount.remaining, FREE_TIER_LIMITS.ACTIVE_GOALS);
  assert.equal(malformedCount.locked, false);
});

test('premium feature gates lock only for free users when relevant', () => {
  assert.equal(getPremiumFeatureGate('focusSessions', false).locked, true);
  assert.equal(getPremiumFeatureGate('focusSessions', true).locked, false);
  assert.equal(getPremiumFeatureGate('focusSessions', false, false).locked, false);
  assert.equal(getPremiumFeatureGate('focusSessions', 'true' as any).locked, true);
  assert.equal(getPremiumFeatureGate('focusSessions', false, 'false' as any).locked, true);
  assert.doesNotMatch(getPremiumFeatureGate('appBlocking', false).featureName, /hard app blocking/i);
  assert.match(getPremiumFeatureGate('focusAndBlocking', false).featureName, /blocked-app planning/i);
});

test('activity edit window allows edits through the 48-hour deadline', () => {
  const loggedAt = '2026-04-20T10:00:00.000Z';
  const deadline = getActivityEditDeadline(loggedAt);

  assert.equal(deadline?.toISOString(), '2026-04-22T10:00:00.000Z');
  assert.equal(canEditActivityLog(loggedAt, new Date('2026-04-22T10:00:00.000Z')), true);
  assert.equal(canEditActivityLog(loggedAt, new Date('2026-04-22T10:00:00.001Z')), false);
});

test('date-only helpers produce stable sortable strings', () => {
  assert.equal(formatDateOnly(new Date(2026, 0, 5, 18, 30, 0, 0)), '2026-01-05');
  assert.equal(getMaxDateString('2026-01-05', '2026-01-06'), '2026-01-06');
  assert.equal(getMaxDateString('2026-02-01', '2026-01-31'), '2026-02-01');
});

test('habit history helper keeps only the free 90-day window for free users', () => {
  const now = new Date(2026, 4, 6, 12, 0, 0, 0);
  const completions = [
    { completedDate: '2026-02-04' },
    { completedDate: '2026-02-06' },
    { completedDate: '2026-05-06' },
  ];

  assert.equal(formatDateOnly(getHabitHistoryCutoffDate(now)), '2026-02-06');
  assert.deepEqual(
    filterHabitHistoryCompletions(completions, false, now).map((completion) => completion.completedDate),
    ['2026-02-06', '2026-05-06'],
  );
  assert.deepEqual(filterHabitHistoryCompletions(completions, true, now), completions);
  assert.deepEqual(
    filterHabitHistoryCompletions(completions, 'true' as any, now).map((completion) => completion.completedDate),
    ['2026-02-06', '2026-05-06'],
  );
});
