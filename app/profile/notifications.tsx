import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';
import {
  areNotificationsEnabledAsync,
  disableNotificationsAsync,
  enableNotificationsAsync,
  syncManagedNotificationsAsync,
} from '@/services/notifications';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettings,
  type NotificationSettings,
  updateNotificationSettings,
} from '@/stores/notificationStore';

type NotificationToggleKey =
  | 'habitRemindersEnabled'
  | 'streakAlertsEnabled'
  | 'goalDeadlineEnabled'
  | 'weeklyReviewEnabled';

const DETAIL_SETTINGS: {
  key: NotificationToggleKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: 'habitRemindersEnabled',
    title: 'Habit reminders',
    description: 'Send reminders at each habit reminder time.',
    icon: 'repeat-outline',
  },
  {
    key: 'streakAlertsEnabled',
    title: 'Streak alerts',
    description: 'Evening alerts when a daily habit still needs a check-in.',
    icon: 'flame-outline',
  },
  {
    key: 'goalDeadlineEnabled',
    title: 'Goal deadline nudges',
    description: 'Nudges one week, one day, and day-of for active goals.',
    icon: 'flag-outline',
  },
  {
    key: 'weeklyReviewEnabled',
    title: 'Weekly review',
    description: 'A Monday reflection reminder to review your week.',
    icon: 'calendar-outline',
  },
];

function normalizeTimeInput(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [weeklyReviewTimeInput, setWeeklyReviewTimeInput] = useState(
    DEFAULT_NOTIFICATION_SETTINGS.weeklyReviewTime,
  );
  const [masterEnabled, setMasterEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masterBusy, setMasterBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadState = useCallback(async () => {
    const [storedSettings, enabled] = await Promise.all([
      getNotificationSettings(),
      areNotificationsEnabledAsync(),
    ]);

    setSettings(storedSettings);
    setWeeklyReviewTimeInput(storedSettings.weeklyReviewTime);
    setMasterEnabled(enabled);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        setLoading(true);

        try {
          const [storedSettings, enabled] = await Promise.all([
            getNotificationSettings(),
            areNotificationsEnabledAsync(),
          ]);

          if (!isActive) return;

          setSettings(storedSettings);
          setWeeklyReviewTimeInput(storedSettings.weeklyReviewTime);
          setMasterEnabled(enabled);
          setLoading(false);
        } catch {
          if (!isActive) return;
          setLoading(false);
          Alert.alert(
            'Could not load notification settings',
            'Please reopen this screen and try again.',
          );
        }
      };

      void run();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleMasterToggle = async (nextValue: boolean) => {
    if (masterBusy || saving) return;

    setMasterBusy(true);

    try {
      if (nextValue) {
        const enabled = await enableNotificationsAsync();
        setMasterEnabled(enabled);

        if (!enabled) {
          Alert.alert(
            'Notifications remain off',
            'Permission was not granted, so reminders are still disabled.',
          );
        }
      } else {
        await disableNotificationsAsync();
        setMasterEnabled(false);
      }

      await loadState();
    } catch {
      Alert.alert(
        'Could not update notifications',
        'Please try again in a moment.',
      );
      await loadState().catch(() => {});
    } finally {
      setMasterBusy(false);
    }
  };

  const handleDetailToggle = async (
    key: NotificationToggleKey,
    nextValue: boolean,
  ) => {
    if (!masterEnabled || masterBusy || saving) return;

    setSaving(true);

    try {
      const updated = await updateNotificationSettings({
        [key]: nextValue,
      });

      setSettings(updated);
      await syncManagedNotificationsAsync();
    } catch {
      Alert.alert(
        'Could not update setting',
        'Please try again in a moment.',
      );
      await loadState().catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWeeklyReviewTime = async () => {
    if (!masterEnabled || masterBusy || saving || !settings.weeklyReviewEnabled) {
      return;
    }

    const normalized = normalizeTimeInput(weeklyReviewTimeInput);

    if (!normalized) {
      Alert.alert(
        'Invalid time',
        'Use 24-hour HH:mm format, for example 18:30.',
      );
      setWeeklyReviewTimeInput(settings.weeklyReviewTime);
      return;
    }

    setSaving(true);

    try {
      const updated = await updateNotificationSettings({
        weeklyReviewTime: normalized,
      });

      setSettings(updated);
      setWeeklyReviewTimeInput(updated.weeklyReviewTime);
      await syncManagedNotificationsAsync();
    } catch {
      Alert.alert(
        'Could not save time',
        'Please try again in a moment.',
      );
      await loadState().catch(() => {
        setWeeklyReviewTimeInput(settings.weeklyReviewTime);
      });
    } finally {
      setSaving(false);
    }
  };

  const controlsDisabled = !masterEnabled || masterBusy || saving;
  const weeklyTimeDirty = weeklyReviewTimeInput !== settings.weeklyReviewTime;
  const weeklyTimeEditable = !controlsDisabled && settings.weeklyReviewEnabled;

  const masterDescription = masterEnabled
    ? 'All selected reminders are active.'
    : settings.enabled
      ? 'Notifications are set to on, but device permission is currently off.'
      : 'All reminders are paused.';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Reminders and review timing</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.masterRow}>
              <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                <Text style={styles.masterTitle}>Enable notifications</Text>
                <Text style={styles.masterDescription}>{masterDescription}</Text>
              </View>
              <Switch
                value={masterEnabled}
                onValueChange={(value) => {
                  void handleMasterToggle(value);
                }}
                disabled={masterBusy || saving}
                trackColor={{ false: Colors.BorderSubtle, true: Colors.SteelBlue + '88' }}
                thumbColor={masterEnabled ? Colors.SteelBlue : Colors.Surface}
              />
            </View>
          </View>

          <View style={styles.card}>
            {DETAIL_SETTINGS.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.detailRow,
                  index < DETAIL_SETTINGS.length - 1 && styles.detailRowBorder,
                  controlsDisabled && styles.rowDisabled,
                ]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={18} color={Colors.SteelBlue} />
                </View>

                <View style={styles.detailCopy}>
                  <Text style={styles.detailTitle}>{item.title}</Text>
                  <Text style={styles.detailDescription}>{item.description}</Text>
                </View>

                <Switch
                  value={settings[item.key]}
                  onValueChange={(value) => {
                    void handleDetailToggle(item.key, value);
                  }}
                  disabled={controlsDisabled}
                  trackColor={{ false: Colors.BorderSubtle, true: Colors.SteelBlue + '88' }}
                  thumbColor={settings[item.key] ? Colors.SteelBlue : Colors.Surface}
                />
              </View>
            ))}
          </View>

          <View style={[styles.card, !weeklyTimeEditable && styles.rowDisabled]}>
            <Text style={styles.weeklyTitle}>Weekly review time</Text>
            <Text style={styles.weeklyDescription}>
              Set the reminder time for your Monday weekly review.
            </Text>

            <View style={styles.timeRow}>
              <View
                style={[
                  styles.timeInputWrap,
                  !weeklyTimeEditable && styles.timeInputWrapDisabled,
                ]}
              >
                <Ionicons name="time-outline" size={16} color={Colors.TextSecondary} />
                <TextInput
                  style={styles.timeInput}
                  value={weeklyReviewTimeInput}
                  onChangeText={setWeeklyReviewTimeInput}
                  editable={weeklyTimeEditable}
                  placeholder="18:30"
                  placeholderTextColor={Colors.TextSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  onSubmitEditing={() => {
                    void handleSaveWeeklyReviewTime();
                  }}
                />
              </View>

              <Pressable
                onPress={() => {
                  void handleSaveWeeklyReviewTime();
                }}
                disabled={!weeklyTimeEditable || !weeklyTimeDirty}
                style={[
                  styles.timeSaveBtn,
                  (!weeklyTimeEditable || !weeklyTimeDirty) && styles.timeSaveBtnDisabled,
                ]}
              >
                <Text style={styles.timeSaveText}>Save</Text>
              </Pressable>
            </View>

            <Text style={styles.weeklyHelper}>Use 24-hour HH:mm format.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    ...CommonStyles.stackHeader,
  },
  headerBtn: {
    ...CommonStyles.stackHeaderButton,
  },
  headerCenter: {
    ...CommonStyles.stackHeaderCenter,
  },
  headerTitle: {
    ...CommonStyles.stackHeaderTitle,
  },
  headerSubtitle: {
    ...CommonStyles.stackHeaderSubtitle,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    ...CommonStyles.surfaceCard,
    padding: Spacing.md,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  masterTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
    lineHeight: 24,
  },
  masterDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.SoftSky + '24',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailCopy: {
    flex: 1,
  },
  detailTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  detailDescription: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  weeklyTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  weeklyDescription: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  timeInputWrap: {
    flex: 1,
    minHeight: 44,
    borderRadius: Shapes.Input,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.SurfaceContainerLow,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeInputWrapDisabled: {
    backgroundColor: Colors.SurfaceContainer,
  },
  timeInput: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  timeSaveBtn: {
    minHeight: 44,
    borderRadius: Shapes.Button,
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSaveBtnDisabled: {
    opacity: 0.45,
  },
  timeSaveText: {
    ...Typography.Body2,
    color: Colors.Surface,
    fontWeight: '700',
  },
  weeklyHelper: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    marginTop: Spacing.xs,
  },
});
