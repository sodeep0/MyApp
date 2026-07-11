import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/stores/notificationStore';
import { getAllCompletions, getAllHabits } from '@/stores/habitStore';
import { getAllGoals } from '@/stores/goalStore';
import {
  WEEKLY_REVIEW_WEEKDAY,
  goalNudgeCandidates,
  habitReminderCandidates,
  isManagedNotificationRecord,
  MANAGED_NOTIFICATION_PREFIX,
  nextStreakAlertDate,
  parseTime,
  routeForNotificationData,
  weeklyReviewTime,
} from '@/services/notificationScheduling';
import {
  GoalStatus,
  HabitFrequency,
  type Habit,
} from '@/types/models';
import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
  type NotificationRequest,
} from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

const CHANNEL_ID = 'kaarma-reminders';
let notificationResponseSubscription: ReturnType<
  typeof Notifications.addNotificationResponseReceivedListener
> | null = null;

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

function scheduleId(scope: string, entityId?: string, suffix?: string): string {
  return [MANAGED_NOTIFICATION_PREFIX, scope, entityId, suffix]
    .filter(Boolean)
    .join(':');
}

function isManagedNotification(request: NotificationRequest): boolean {
  return isManagedNotificationRecord(request);
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
  const parsed = weeklyReviewTime(time);

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

async function scheduleNotificationBestEffortAsync(
  identifier: string,
  content: Notifications.NotificationContentInput,
  trigger: Notifications.NotificationTriggerInput,
): Promise<boolean> {
  try {
    await scheduleNotificationAsync(identifier, content, trigger);
    return true;
  } catch (error) {
    console.warn(`Failed to schedule notification "${identifier}"`, error);
    return false;
  }
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

  if (!notificationResponseSubscription) {
    notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeForNotificationData(
        response.notification.request.content.data as Record<string, unknown> | null | undefined,
      );

      if (route) {
        router.push(route as any);
      }
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

  const results = await Promise.allSettled(
    managed.map((request) => (
      Notifications.cancelScheduledNotificationAsync(request.identifier)
    )),
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(
        `Failed to cancel notification "${managed[index].identifier}"`,
        result.reason,
      );
    }
  });
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

  const now = new Date();
  let scheduledCount = 0;

  const [habits, goals] = await Promise.all([
    getAllHabits(),
    getAllGoals(),
  ]);

  if (settings.habitRemindersEnabled) {
    const scheduled = await Promise.all(
      habitReminderCandidates(habits)
        .map(async ({ habit, reminderTime }) => {
          return scheduleNotificationBestEffortAsync(
            scheduleId('habit-reminder', habit.id),
            {
              title: 'Habit reminder',
              body: `Time for ${habit.name}.`,
              data: {
                type: 'habit-reminder',
                habitId: habit.id,
              },
            },
            dailyTrigger(reminderTime),
          );
        }),
    );
    scheduledCount += scheduled.filter(Boolean).length;
  }

  if (settings.streakAlertsEnabled) {
    const allCompletions = await getAllCompletions();
    const scheduled = await Promise.all(
      habits
        .filter(
          (habit) =>
            !habit.isArchived && habit.frequency === HabitFrequency.DAILY,
        )
        .map(async (habit: Habit) => {
          try {
            const completions = allCompletions.filter(
              (completion) => completion.habitId === habit.id,
            );
            return scheduleNotificationBestEffortAsync(
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
          } catch (error) {
            console.warn(`Failed to prepare streak alert for habit "${habit.id}"`, error);
            return false;
          }
        }),
    );
    scheduledCount += scheduled.filter(Boolean).length;
  }

  if (settings.goalDeadlineEnabled) {
    const scheduled = await Promise.all(
      goals
        .filter((goal) => goal.status === GoalStatus.ACTIVE)
        .flatMap((goal) =>
          goalNudgeCandidates(goal).map(async (candidate) => {
            if (candidate.triggerDate.getTime() <= now.getTime()) {
              return false;
            }

            return scheduleNotificationBestEffortAsync(
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
          }),
        ),
    );
    scheduledCount += scheduled.filter(Boolean).length;
  }

  if (settings.weeklyReviewEnabled) {
    const scheduled = await scheduleNotificationBestEffortAsync(
      scheduleId('weekly-review'),
      {
        title: 'Weekly review',
        body: 'Check in on your habits, goals, and reflections before the week resets.',
        data: {
          type: 'weekly-review',
        },
      },
      weeklyTrigger(WEEKLY_REVIEW_WEEKDAY, settings.weeklyReviewTime),
    );
    if (scheduled) scheduledCount += 1;
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
