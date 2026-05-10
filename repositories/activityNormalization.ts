import { ActivityCategory, ActivityIntensity, type ActivityLog } from '@/types/models';

function isActivityCategory(value: unknown): value is ActivityCategory {
  return Object.values(ActivityCategory).includes(value as ActivityCategory);
}

function isActivityIntensity(value: unknown): value is ActivityIntensity {
  return Object.values(ActivityIntensity).includes(value as ActivityIntensity);
}

export function normalizeActivities(value: unknown): ActivityLog[] {
  if (!Array.isArray(value)) return [];

  return value.filter((activity): activity is ActivityLog => (
    !!activity
    && typeof activity === 'object'
    && typeof (activity as Partial<ActivityLog>).id === 'string'
    && typeof (activity as Partial<ActivityLog>).name === 'string'
    && isActivityCategory((activity as Partial<ActivityLog>).category)
    && isActivityIntensity((activity as Partial<ActivityLog>).intensity)
    && Number.isFinite((activity as Partial<ActivityLog>).durationMinutes)
    && typeof (activity as Partial<ActivityLog>).date === 'string'
    && typeof (activity as Partial<ActivityLog>).time === 'string'
    && typeof (activity as Partial<ActivityLog>).loggedAt === 'string'
  ));
}
