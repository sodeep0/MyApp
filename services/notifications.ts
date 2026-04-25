import { getGoalRepository, getHabitRepository } from '@/repositories/factory';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/stores/notificationStore';
import {
  GoalStatus,
  HabitFrequency,
  type Goal,
  type Habit,
  type HabitCompletion,
} from '@/types/models';
import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  type NotificationRequest,
} from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'kaarma-reminders';
const MANAGED_NOTIFICATION_PREFIX = 'kaarma';
const STREAK_ALERT_TIME = '20:30';
const GOAL_NUDGE_TIME = '09:00';

function supportsLocalNotifications(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

if (supportsLocalNotifications()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

function createDateWithTime(base: Date, time: string): Date {
  const parsed = parseTime(time) ?? parseTime('09:00')!;

  return new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    parsed.hour,
    parsed.minute,
    0,
    0,
  );
}

function dateToKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function scheduleId(scope: string, entityId?: string, suffix?: string): string {
  return [MANAGED_NOTIFICATION_PREFIX, scope, entityId, suffix]
    .filter(Boolean)
    .join(':');
}

function isManagedNotification(request: NotificationRequest): boolean {
  if (request.identifier.startsWith(MANAGED_NOTIFICATION_PREFIX)) {
    return true;
  }

  return request.content.data?.scope === 'kaarma';
}

function hasCompletedToday(completions: HabitCompletion[], now: Date): boolean {
  const todayKey = dateToKey(now);
  return completions.some((completion) => completion.completedDate === todayKey);
}

function nextStreakAlertDate(
  completions: HabitCompletion[],
  now: Date,
): Date {
  const completedToday = hasCompletedToday(completions, now);
  const todayAlert = createDateWithTime(now, STREAK_ALERT_TIME);

  if (!completedToday && todayAlert.getTime() > now.getTime()) {
    return todayAlert;
  }

  return createDateWithTime(addDays(now, 1), STREAK_ALERT_TIME);
}

function goalNudgeCandidates(goal: Goal): Array<{
  idSuffix: string;
  body: string;
  triggerDate: Date;
}> {
  if (!goal.targetDate || goal.status !== GoalStatus.ACTIVE) {
    return [];
  }

  const targetDate = new Date(goal.targetDate);
  if (Number.isNaN(targetDate.getTime())) {
    return [];
  }

  const dueDate = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
    0,
    0,
    0,
    0,
  );

  return [
    {
      idSuffix: 'week',
      body: `${goal.title} is due in one week.`,
      triggerDate: createDateWithTime(addDays(dueDate, -7), GOAL_NUDGE_TIME),
    },
    {
      idSuffix: 'day',
      body: `${goal.title} is due tomorrow.`,
      triggerDate: createDateWithTime(addDays(dueDate, -1), GOAL_NUDGE_TIME),
    },
    {
      idSuffix: 'today',
      body: `${goal.title} is due today. Make space for one more push.`,
      triggerDate: createDateWithTime(dueDate, GOAL_NUDGE_TIME),
    },
  ];
}

function dailyTrigger(time: string): Notifications.DailyTriggerInput {
  const parsed = parseTime(time) ?? parseTime('09:00')!;

  return {
    type: SchedulableTriggerInputTypes.DAILY,
    hour: parsed.hour,
    minute: parsed.minute,
    channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
  };
}

function weeklyTrigger(
  weekday: number,
  time: string,
): Notifications.WeeklyTriggerInput {
  const parsed = parseTime(time) ?? parseTime('18:30')!;

  return {
    type: SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour: parsed.hour,
    minute: parsed.minute,
    channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
  };
}

function dateTrigger(date: Date): Notifications.DateTriggerInput {
  return {
    type: SchedulableTriggerInputTypes.DATE,
    date,
    channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
  };
}

function notificationsPermissionGranted(
  permissions: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === IosAuthorizationStatus.AUTHORIZED ||
    permissions.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === IosAuthorizationStatus.EPHEMERAL
  );
}

async function scheduleNotificationAsync(
  identifier: string,
  content: Notifications.NotificationContentInput,
  trigger: Notifications.NotificationTriggerInput,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      sound: true,
      ...content,
      data: {
        ...(content.data ?? {}),
        scope: 'kaarma',
      },
    },
    trigger,
  });
}

export async function initializeNotificationsAsync(): Promise<void> {
  if (!supportsLocalNotifications()) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Kaarma reminders',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      showBadge: true,
    });
  }
}

export async function hasNotificationPermissionAsync(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  const permissions = await Notifications.getPermissionsAsync();
  return notificationsPermissionGranted(permissions);
}

export async function areNotificationsEnabledAsync(): Promise<boolean> {
  const settings = await getNotificationSettings();
  if (!settings.enabled) return false;

  return hasNotificationPermissionAsync();
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  if (!supportsLocalNotifications()) return false;

  await initializeNotificationsAsync();

  const permissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return notificationsPermissionGranted(permissions);
}

export async function cancelManagedNotificationsAsync(): Promise<void> {
  if (!supportsLocalNotifications()) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const managed = scheduled.filter(isManagedNotification);

  await Promise.all(
    managed.map((request) =>
      Notifications.cancelScheduledNotificationAsync(request.identifier),
    ),
  );
}

export async function syncManagedNotificationsAsync(): Promise<number> {
  if (!supportsLocalNotifications()) return 0;

  await initializeNotificationsAsync();

  const settings = await getNotificationSettings();
  const hasPermission = await hasNotificationPermissionAsync();

  if (!settings.enabled || !hasPermission) {
    await cancelManagedNotificationsAsync();
    return 0;
  }

  await cancelManagedNotificationsAsync();

  const habitRepository = getHabitRepository();
  const goalRepository = getGoalRepository();
  const now = new Date();
  let scheduledCount = 0;

  const [habits, goals] = await Promise.all([
    habitRepository.getAllHabits(),
    goalRepository.getAllGoals(),
  ]);

  if (settings.habitRemindersEnabled) {
    await Promise.all(
      habits
        .filter((habit) => !habit.isArchived && Boolean(habit.reminderTime))
        .map(async (habit) => {
          await scheduleNotificationAsync(
            scheduleId('habit-reminder', habit.id),
            {
              title: 'Habit reminder',
              body: `Time for ${habit.name}.`,
              data: {
                type: 'habit-reminder',
                habitId: habit.id,
              },
            },
            dailyTrigger(habit.reminderTime!),
          );
          scheduledCount += 1;
        }),
    );
  }

  if (settings.streakAlertsEnabled) {
    await Promise.all(
      habits
        .filter(
          (habit) =>
            !habit.isArchived && habit.frequency === HabitFrequency.DAILY,
        )
        .map(async (habit: Habit) => {
          const completions = await habitRepository.getCompletionsForHabit(
            habit.id,
          );
          await scheduleNotificationAsync(
            scheduleId('streak-alert', habit.id),
            {
              title: 'Streak check-in',
              body: `${habit.name} still needs today's checkmark.`,
              data: {
                type: 'streak-alert',
                habitId: habit.id,
              },
            },
            dateTrigger(nextStreakAlertDate(completions, now)),
          );
          scheduledCount += 1;
        }),
    );
  }

  if (settings.goalDeadlineEnabled) {
    await Promise.all(
      goals
        .filter((goal) => goal.status === GoalStatus.ACTIVE)
        .flatMap((goal) =>
          goalNudgeCandidates(goal).map(async (candidate) => {
            if (candidate.triggerDate.getTime() <= now.getTime()) {
              return;
            }

            await scheduleNotificationAsync(
              scheduleId('goal-deadline', goal.id, candidate.idSuffix),
              {
                title: 'Goal deadline',
                body: candidate.body,
                data: {
                  type: 'goal-deadline',
                  goalId: goal.id,
                },
              },
              dateTrigger(candidate.triggerDate),
            );
            scheduledCount += 1;
          }),
        ),
    );
  }

  if (settings.weeklyReviewEnabled) {
    await scheduleNotificationAsync(
      scheduleId('weekly-review'),
      {
        title: 'Weekly review',
        body: 'Check in on your habits, goals, and reflections before the week resets.',
        data: {
          type: 'weekly-review',
        },
      },
      weeklyTrigger(1, settings.weeklyReviewTime),
    );
    scheduledCount += 1;
  }

  return scheduledCount;
}

export async function enableNotificationsAsync(): Promise<boolean> {
  const granted = await requestNotificationPermissionAsync();

  await updateNotificationSettings({
    enabled: granted,
  });

  if (!granted) {
    await cancelManagedNotificationsAsync();
    return false;
  }

  await syncManagedNotificationsAsync();
  return true;
}

export async function disableNotificationsAsync(): Promise<void> {
  await updateNotificationSettings({
    enabled: false,
  });
  await cancelManagedNotificationsAsync();
}
