import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Colors,
  Shadows,
  Shapes,
  Spacing,
  Typography,
} from "../../constants/theme";
import { LoadingState } from "@/components/LoadingState";
import { HomeBadHabitCard } from "@/components/home/HomeBadHabitCard";
import { HomeGoalCard, getGoalProgress } from "@/components/home/HomeGoalCard";
import { HomeHabitSection } from "@/components/home/HomeHabitSection";
import { HOME_QUICK_ACTIONS, QuickActions } from "@/components/home/QuickActions";
import { areNotificationsEnabledAsync } from "@/services/notifications";
import {
  getNotificationSettings,
  type NotificationSettings,
} from "@/stores/notificationStore";
import { useDisplayName } from "../../hooks/useStore";
import { navigateWithJournalAccess } from "../../services/journalGate";
import {
  getAllBadHabits,
  getAllUrgeEvents,
} from "../../stores/badHabitStore";
import { getAllGoals } from "../../stores/goalStore";
import {
  calculateStreak as calcStreak,
  getAllCompletions,
  getAllHabits,
  getCompletionsForHabit,
  markHabitComplete,
  unmarkHabitComplete,
  todayStr,
} from "../../stores/habitStore";
import {
  type BadHabit,
  type Goal,
  type Habit,
} from "../../types/models";

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return `Good morning, ${name}`;
  if (hour >= 12 && hour < 18) return `Good afternoon, ${name}`;
  if (hour >= 18 && hour < 22) return `Good evening, ${name}`;
  return `Hey, ${name}`;
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const goalKeyExtractor = (goal: Goal) => goal.id;
const badHabitKeyExtractor = (habit: BadHabit) => habit.id;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [displayName] = useDisplayName();

  const [showFAB, setShowFAB] = useState(false);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badHabits, setBadHabits] = useState<BadHabit[]>([]);
  const [todayDone, setTodayDone] = useState<Set<string>>(new Set());
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [relapsedBadHabitIds, setRelapsedBadHabitIds] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        void loadAllData();
      });

      return () => {
        task.cancel();
        setShowFAB(false);
      };
    }, []),
  );

  const loadAllData = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [
        habitsData,
        goalsData,
        badHabitsData,
        urgeEvents,
        settings,
        remindersEnabled,
      ] = await Promise.all([
        getAllHabits(),
        getAllGoals(),
        getAllBadHabits(),
        getAllUrgeEvents(),
        getNotificationSettings(),
        areNotificationsEnabledAsync(),
      ]);

      setHabits(habitsData);
      setGoals(goalsData);
      setBadHabits(badHabitsData);
      setNotificationSettings(settings);
      setNotificationsEnabled(remindersEnabled);

      const doneSet = new Set<string>();
      const streakMap: Record<string, number> = {};
      const allCompletions = await getAllCompletions();
      const today = todayStr();

      for (const habit of habitsData) {
        const habitCompletions = allCompletions.filter((c) => c.habitId === habit.id);
        if (habitCompletions.some((c) => c.completedDate === today)) {
          doneSet.add(habit.id);
        }
        streakMap[habit.id] = calcStreak(
          habitCompletions,
          habit.frequency,
          habit.weekDays,
          habit.timesPerWeek,
          habit.everyNDays,
        );
      }

      setTodayDone(doneSet);
      setStreaks(streakMap);

      const relapsedIds = new Set(
        urgeEvents
          .filter((event) => event.type === "RELAPSE")
          .map((event) => event.badHabitId),
      );
      setRelapsedBadHabitIds(relapsedIds);
    } catch (error) {
      console.warn("Home failed to load.", error);
      setLoadError("Could not load today's data. Pull back to this tab or try again.");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = todayDone.size;
  const totalHabits = habits.length;
  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "ACTIVE"),
    [goals],
  );
  const maxStreak = useMemo(() => {
    const values = Object.values(streaks);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [streaks]);
  const displayNameStr = String(displayName).split(" ")[0] || "User";
  const activeReminderTypes = useMemo(() => {
    if (!notificationSettings) return 0;
    return [
      notificationSettings.habitRemindersEnabled,
      notificationSettings.streakAlertsEnabled,
      notificationSettings.goalDeadlineEnabled,
      notificationSettings.weeklyReviewEnabled,
    ].filter(Boolean).length;
  }, [notificationSettings]);
  const notificationSummary = notificationsEnabled
    ? `${activeReminderTypes} reminder type${activeReminderTypes === 1 ? "" : "s"} active`
    : notificationSettings?.enabled
      ? "Device permission is off"
      : "Reminders are paused";

  const dailyScore = useMemo(() => {
    const habitCompletion = totalHabits > 0 ? completedCount / totalHabits : 0;
    const goalMomentum =
      activeGoals.length > 0
        ? activeGoals.filter((goal) => getGoalProgress(goal) > 0).length /
          activeGoals.length
        : 0;
    const streakMomentum = Math.min(maxStreak / 7, 1);

    return Math.round(
      (habitCompletion * 0.6 + goalMomentum * 0.2 + streakMomentum * 0.2) * 100,
    );
  }, [activeGoals, completedCount, maxStreak, totalHabits]);

  const topHabits = useMemo(
    () =>
      [...habits]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3),
    [habits],
  );
  const topBadHabits = useMemo(
    () =>
      [...badHabits]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [badHabits],
  );

  const toggleComplete = async (habitId: string) => {
    const wasDone = todayDone.has(habitId);

    setTodayDone((prev) => {
      const next = new Set(prev);
      if (wasDone) {
        next.delete(habitId);
      } else {
        next.add(habitId);
      }
      return next;
    });

    try {
      if (wasDone) {
        await unmarkHabitComplete(habitId);
      } else {
        await markHabitComplete(habitId);
        const habit = habits.find((h) => h.id === habitId);
        if (habit) {
          const completions = await getCompletionsForHabit(habitId);
          const streak = calcStreak(
            completions,
            habit.frequency,
            habit.weekDays,
            habit.timesPerWeek,
            habit.everyNDays,
          );
          setStreaks((prev) => ({ ...prev, [habitId]: streak }));
        }
      }
    } catch (error) {
      console.warn("Habit toggle failed.", error);
      setTodayDone((prev) => {
        const next = new Set(prev);
        if (wasDone) {
          next.add(habitId);
        } else {
          next.delete(habitId);
        }
        return next;
      });
      Alert.alert("Could not update habit", "Please try again in a moment.");
    }
  };

  const handleQuickActionPress = (route: string) => {
    if (route.includes("/track/journal")) {
      void navigateWithJournalAccess(router, route);
      return;
    }

    router.push(route as any);
  };

  const handleGoalPress = useCallback(
    (goalId: string) => {
      router.push(`/goals/detail?id=${goalId}` as any);
    },
    [router],
  );

  const handleBadHabitPress = useCallback(
    (badHabitId: string) => {
      router.push(`/track/bad-habit-detail?id=${badHabitId}` as any);
    },
    [router],
  );

  const renderGoalItem = useCallback(
    ({ item }: { item: Goal }) => (
      <HomeGoalCard goal={item} onPress={handleGoalPress} />
    ),
    [handleGoalPress],
  );

  const renderBadHabitItem = useCallback(
    ({ item }: { item: BadHabit }) => (
      <HomeBadHabitCard
        badHabit={item}
        relapsed={relapsedBadHabitIds.has(item.id)}
        onPress={handleBadHabitPress}
      />
    ),
    [handleBadHabitPress, relapsedBadHabitIds],
  );

  if (loading) {
    return (
      <LoadingState
        fullScreen
        title="Loading Home"
        message="Gathering today's habits, goals, and recovery check-ins."
      />
    );
  }

  if (loadError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", paddingHorizontal: Spacing.screenH }]}>
        <Text style={{ ...Typography.Body1, color: Colors.TextSecondary, textAlign: "center", marginBottom: Spacing.md }}>
          {loadError}
        </Text>
        <Pressable
          onPress={() => void loadAllData()}
          style={({ pressed }) => [
            styles.retryBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={{ ...Typography.Body2, color: Colors.SteelBlue, fontWeight: "600" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 190 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{getDateString()}</Text>
            <Text style={styles.greeting}>{getGreeting(displayNameStr)} 👋</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/profile/notifications" as any)}
              style={({ pressed }) => [
                styles.notificationBell,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Ionicons
                name={notificationsEnabled ? "notifications" : "notifications-outline"}
                size={20}
                color={notificationsEnabled ? Colors.Success : Colors.SteelBlue}
              />
            </Pressable>

            <Pressable
              onPress={() => router.push("/profile" as any)}
              style={({ pressed }) => [
                styles.avatar,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Ionicons name="person" size={20} color={Colors.SteelBlue} />
            </Pressable>
          </View>
        </View>

        <View style={styles.scoreCard}>
          <LinearGradient
            colors={[Colors.Success, Colors.SteelBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreGradient}
          >
            <View style={styles.scoreTop}>
              <Text style={styles.scoreLabel}>Daily Kaarma Score</Text>
              <View style={styles.scoreValueRow}>
                <Text style={styles.scoreValue}>{dailyScore}</Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
            </View>

            <View style={styles.scoreDivider} />

            <View style={styles.scoreBottomRow}>
              <View style={styles.scoreStatCol}>
                <Text style={styles.scoreStatValue}>{`${completedCount}/${Math.max(totalHabits, 0)}`}</Text>
                <Text style={styles.scoreStatLabel}>Habits</Text>
              </View>

              <View style={styles.scoreStatCol}>
                <Text style={styles.scoreStatValue}>{activeGoals.length}</Text>
                <Text style={styles.scoreStatLabel}>Goals</Text>
              </View>

              <View style={styles.streakPill}>
                <Ionicons name="flame" size={13} color={Colors.Surface} />
                <Text style={styles.streakPillText}>{`${maxStreak} day streak`}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <QuickActions onActionPress={handleQuickActionPress} />

        <Pressable
          onPress={() => router.push("/profile/notifications" as any)}
          style={({ pressed }) => [
            styles.reminderCard,
            { transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
        >
          <View
            style={[
              styles.reminderIconWrap,
              {
                backgroundColor: notificationsEnabled
                  ? Colors.Success + "18"
                  : Colors.WarmSand,
              },
            ]}
          >
            <Ionicons
              name={notificationsEnabled ? "notifications" : "notifications-off-outline"}
              size={20}
              color={notificationsEnabled ? Colors.Success : Colors.TextSecondary}
            />
          </View>
          <View style={styles.reminderCopy}>
            <Text style={styles.reminderTitle}>Reminders</Text>
            <Text style={styles.reminderMeta}>{notificationSummary}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.TextSecondary} />
        </Pressable>

        <HomeHabitSection
          habits={topHabits}
          todayDone={todayDone}
          onSeeAll={() => router.push("/(tabs)/habits" as any)}
          onHabitPress={(habitId) => router.push(`/habits/detail?id=${habitId}` as any)}
          onToggleComplete={toggleComplete}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <Pressable onPress={() => router.push("/(tabs)/goals" as any)}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>

          {activeGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={24} color={Colors.DustyTaupe} />
              <Text style={styles.emptyStateTitle}>No active goals</Text>
              <Text style={styles.emptyStateCaption}>Set a target and track momentum here.</Text>
            </View>
          ) : (
            <FlatList
              data={activeGoals}
              horizontal
              nestedScrollEnabled
              keyExtractor={goalKeyExtractor}
              contentContainerStyle={styles.goalListContent}
              initialNumToRender={3}
              maxToRenderPerBatch={4}
              windowSize={5}
              removeClippedSubviews
              showsHorizontalScrollIndicator={false}
              renderItem={renderGoalItem}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bad Habits</Text>
            <Pressable onPress={() => router.push("/(tabs)/track/bad-habits" as any)}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>

          {topBadHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.DustyTaupe} />
              <Text style={styles.emptyStateTitle}>No bad habits tracked</Text>
              <Text style={styles.emptyStateCaption}>Add one to start your private recovery journey.</Text>
            </View>
          ) : (
            <FlatList
              data={topBadHabits}
              horizontal
              nestedScrollEnabled
              keyExtractor={badHabitKeyExtractor}
              contentContainerStyle={styles.badHabitListContent}
              initialNumToRender={3}
              maxToRenderPerBatch={4}
              windowSize={5}
              removeClippedSubviews
              showsHorizontalScrollIndicator={false}
              renderItem={renderBadHabitItem}
            />
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setShowFAB(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + 82,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Ionicons name="add" size={28} color={Colors.Surface} />
      </Pressable>

      <Modal
        visible={showFAB}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFAB(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowFAB(false)}>
          <View style={styles.sheet}>
            {HOME_QUICK_ACTIONS.map((action) => (
              <Pressable
              key={action.label}
              onPress={() => {
                setShowFAB(false);
                handleQuickActionPress(action.route);
              }}
              style={styles.sheetOption}
            >
                <Ionicons name={action.icon as any} size={20} color={Colors.SteelBlue} />
                <Text style={styles.sheetLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  retryBtn: {
    alignSelf: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 16,
    backgroundColor: Colors.SurfaceContainerLow,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dateText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  greeting: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    marginTop: 4,
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SoftSky + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SoftSky + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCard: {
    borderRadius: 32,
    overflow: "hidden",
    ...Shadows.HeroCard,
  },
  scoreGradient: {
    padding: Spacing.lg,
  },
  scoreTop: {
    marginBottom: Spacing.md,
  },
  scoreLabel: {
    ...Typography.Caption,
    color: Colors.Surface + "CC",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  scoreValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginTop: Spacing.xs,
  },
  scoreValue: {
    ...Typography.Display,
    color: Colors.Surface,
    fontSize: 68,
    lineHeight: 72,
    fontWeight: "500" as const,
  },
  scoreOutOf: {
    ...Typography.Body2,
    color: Colors.Surface + "A8",
    marginBottom: 10,
  },
  scoreDivider: {
    height: 1,
    backgroundColor: Colors.Surface + "40",
    marginBottom: Spacing.md,
  },
  scoreBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  scoreStatCol: {
    minWidth: 56,
  },
  scoreStatValue: {
    ...Typography.Body1,
    color: Colors.Surface,
    fontWeight: "700" as const,
  },
  scoreStatLabel: {
    ...Typography.Caption,
    color: Colors.Surface + "B8",
    marginTop: 2,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: Shapes.PillButton,
    backgroundColor: Colors.Surface + "2F",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
  },
  streakPillText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: "700" as const,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: Spacing.sm,
  },
  quickCard: {
    width: "48.4%",
    backgroundColor: Colors.SurfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  quickLabel: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  reminderCard: {
    minHeight: 68,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.Card,
  },
  reminderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderCopy: {
    flex: 1,
  },
  reminderTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "700" as const,
  },
  reminderMeta: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  sectionAction: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  emptyState: {
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    alignItems: "center",
    gap: 6,
  },
  emptyStateTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "600" as const,
  },
  emptyStateCaption: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: "center" as const,
  },
  habitList: {
    gap: Spacing.sm,
  },
  habitCard: {
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.Card,
  },
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  habitIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  habitTextBlock: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "600" as const,
  },
  habitNameDone: {
    color: Colors.TextSecondary,
    textDecorationLine: "line-through" as const,
  },
  habitBadge: {
    alignSelf: "flex-start",
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  habitBadgeText: {
    ...Typography.Micro,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.7,
  },
  goalListContent: {
    paddingRight: Spacing.xs,
  },
  goalCard: {
    width: 280,
    borderRadius: 30,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    marginRight: Spacing.sm,
    ...Shadows.Card,
  },
  goalCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  goalEmoji: {
    fontSize: 28,
  },
  goalProgressPill: {
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  goalProgressPillText: {
    ...Typography.Micro,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  goalTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: 2,
  },
  goalDate: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.md,
  },
  goalBarTrack: {
    height: 8,
    borderRadius: Shapes.PillButton,
    backgroundColor: Colors.SurfaceContainerLow,
    overflow: "hidden",
  },
  goalBarFill: {
    height: "100%",
    borderRadius: Shapes.PillButton,
  },
  badHabitListContent: {
    paddingRight: Spacing.xs,
  },
  badHabitCard: {
    width: 280,
    borderRadius: 30,
    padding: Spacing.md,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    marginRight: Spacing.sm,
    ...Shadows.Card,
  },
  badHabitCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  badHabitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badHabitMetaPill: {
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badHabitMetaPillText: {
    ...Typography.Micro,
    textTransform: "uppercase" as const,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
  },
  badHabitTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: 2,
  },
  badHabitCaption: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: 2,
  },
  badHabitDate: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.md,
  },
  badHabitBarTrack: {
    height: 8,
    borderRadius: Shapes.PillButton,
    backgroundColor: Colors.SurfaceContainerLow,
    overflow: "hidden",
  },
  badHabitBarFill: {
    height: "100%",
    borderRadius: Shapes.PillButton,
  },
  fab: {
    position: "absolute",
    right: Spacing.screenH,
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.TextPrimary,
    ...Shadows.FAB,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.OverlayLight,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.BottomSheet,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.Modal,
  },
  sheetOption: {
    minHeight: 52,
    borderRadius: Shapes.Input,
    backgroundColor: Colors.SurfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sheetLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "600" as const,
  },
});
