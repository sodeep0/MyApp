import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Colors,
  Shadows,
  Shapes,
  Spacing,
  Typography,
} from "../../constants/theme";
import { useDisplayName } from "../../hooks/useStore";
import {
  daysSinceQuit,
  getAllBadHabits,
  getAllUrgeEvents,
} from "../../stores/badHabitStore";
import { getAllGoals } from "../../stores/goalStore";
import {
  calculateStreak as calcStreak,
  getAllHabits,
  getCompletionsForHabit,
  getTodayCompletionsForHabit,
  markHabitComplete,
  unmarkHabitComplete,
} from "../../stores/habitStore";
import {
  type BadHabit,
  type Goal,
  type Habit,
  HabitCategory,
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

function getGoalProgress(goal: Goal) {
  if (goal.goalType === "QUANTITATIVE" && goal.targetValue && goal.targetValue > 0) {
    return Math.min(goal.currentValue / goal.targetValue, 1);
  }

  if (goal.goalType === "MILESTONE" && goal.milestones.length > 0) {
    const done = goal.milestones.filter((m) => m.isCompleted).length;
    return Math.min(done / goal.milestones.length, 1);
  }

  return 0;
}

function getHabitCategoryLabel(category: HabitCategory) {
  if (category === HabitCategory.HEALTH) return "Health";
  if (category === HabitCategory.MIND) return "Mind";
  if (category === HabitCategory.WORK) return "Work";
  if (category === HabitCategory.PERSONAL) return "Personal";
  return "Custom";
}

function getGoalEmoji(goal: Goal) {
  if (goal.category === "FITNESS") return "🏃";
  if (goal.category === "LEARNING") return "📚";
  if (goal.category === "CAREER") return "💼";
  if (goal.category === "FINANCE") return "💰";
  if (goal.category === "RELATIONSHIP") return "❤️";
  return "🎯";
}

function getGoalAccent(goal: Goal) {
  if (goal.category === "FITNESS") return Colors.Success;
  if (goal.category === "LEARNING") return Colors.SteelBlue;
  if (goal.category === "CAREER") return Colors.Warning;
  if (goal.category === "FINANCE") return Colors.TextSecondary;
  if (goal.category === "RELATIONSHIP") return Colors.Danger;
  return Colors.SoftSky;
}

const QUICK_ACTIONS = [
  {
    label: "Habit",
    icon: "add-circle-outline",
    route: "/(tabs)/habits/add-edit" as const,
  },
  {
    label: "Log",
    icon: "create-outline",
    route: "/(tabs)/track/activity" as const,
  },
  {
    label: "Journal",
    icon: "book-outline",
    route: "/(tabs)/track/journal" as const,
  },
  {
    label: "Goals",
    icon: "flag-outline",
    route: "/(tabs)/goals/add-edit" as const,
  },
];

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
  const [bestStreakDays, setBestStreakDays] = useState(0);
  const [hasRelapsed, setHasRelapsed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
      return () => setShowFAB(false);
    }, []),
  );

  const loadAllData = async () => {
    const [habitsData, goalsData, badHabitsData, urgeEvents] = await Promise.all([
      getAllHabits(),
      getAllGoals(),
      getAllBadHabits(),
      getAllUrgeEvents(),
    ]);

    setHabits(habitsData);
    setGoals(goalsData);
    setBadHabits(badHabitsData);

    const doneSet = new Set<string>();
    const streakMap: Record<string, number> = {};

    await Promise.all(
      habitsData.map(async (habit) => {
        const done = await getTodayCompletionsForHabit(habit.id);
        if (done.length > 0) doneSet.add(habit.id);

        const completions = await getCompletionsForHabit(habit.id);
        streakMap[habit.id] = calcStreak(
          completions,
          habit.frequency,
          habit.weekDays,
          habit.timesPerWeek,
          habit.everyNDays,
        );
      }),
    );

    setTodayDone(doneSet);
    setStreaks(streakMap);

    let bestDays = 0;
    let relapsed = false;
    badHabitsData.forEach((bh) => {
      const hasBadHabitRelapse = urgeEvents.some(
        (event) => event.badHabitId === bh.id && event.type === "RELAPSE",
      );
      if (hasBadHabitRelapse) relapsed = true;
      bestDays = Math.max(bestDays, daysSinceQuit(bh.quitDate));
    });
    setBestStreakDays(bestDays);
    setHasRelapsed(relapsed);
  };

  const completedCount = todayDone.size;
  const totalHabits = habits.length;
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const maxStreak =
    Object.values(streaks).length > 0 ? Math.max(...Object.values(streaks)) : 0;
  const recoveryPct = Math.max(0, Math.min(bestStreakDays / 7, 1));
  const displayNameStr = String(displayName).split(" ")[0] || "User";

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

  const topHabits = [...habits]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  const toggleComplete = async (habitId: string) => {
    if (todayDone.has(habitId)) {
      await unmarkHabitComplete(habitId);
      setTodayDone((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
      return;
    }

    await markHabitComplete(habitId);
    setTodayDone((prev) => {
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });

    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const completions = await getCompletionsForHabit(habitId);
    const streak = calcStreak(
      completions,
      habit.frequency,
      habit.weekDays,
      habit.timesPerWeek,
      habit.everyNDays,
    );
    setStreaks((prev) => ({ ...prev, [habitId]: streak }));
  };

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

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [
                styles.quickCard,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Ionicons name={action.icon as any} size={22} color={Colors.SteelBlue} />
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>
            <Pressable onPress={() => router.push("/(tabs)/habits" as any)}>
              <Text style={styles.sectionAction}>See all</Text>
            </Pressable>
          </View>

          {topHabits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={24} color={Colors.DustyTaupe} />
              <Text style={styles.emptyStateTitle}>No habits yet</Text>
              <Text style={styles.emptyStateCaption}>Create one to start your day with intent.</Text>
            </View>
          ) : (
            <View style={styles.habitList}>
              {topHabits.map((habit) => {
                const completed = todayDone.has(habit.id);
                const category = getHabitCategoryLabel(habit.category);
                const badgeBg = completed ? Colors.Success + "20" : Colors.SoftSky + "2A";
                const badgeColor = completed ? Colors.Success : Colors.SteelBlue;

                return (
                  <Pressable
                    key={habit.id}
                    onPress={() => router.push(`/habits/detail?id=${habit.id}` as any)}
                    style={({ pressed }) => [
                      styles.habitCard,
                      { transform: [{ scale: pressed ? 0.99 : 1 }] },
                    ]}
                  >
                    <View style={styles.habitLeft}>
                      <View
                        style={[
                          styles.habitIconCircle,
                          {
                            borderColor: completed ? Colors.Success : Colors.SteelBlue,
                            backgroundColor: completed
                              ? Colors.Success + "12"
                              : Colors.SteelBlue + "10",
                          },
                        ]}
                      >
                        <Ionicons
                          name={completed ? "checkmark" : "ellipse-outline"}
                          size={18}
                          color={completed ? Colors.Success : Colors.SteelBlue}
                        />
                      </View>

                      <View style={styles.habitTextBlock}>
                        <Text
                          style={[styles.habitName, completed && styles.habitNameDone]}
                          numberOfLines={1}
                        >
                          {habit.name || "Untitled Habit"}
                        </Text>
                        <View style={[styles.habitBadge, { backgroundColor: badgeBg }]}> 
                          <Text style={[styles.habitBadgeText, { color: badgeColor }]}>
                            {category}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable onPress={() => toggleComplete(habit.id)} hitSlop={8}>
                      <Ionicons
                        name={completed ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={completed ? Colors.Success : Colors.DustyTaupe}
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

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
              keyExtractor={(goal) => goal.id}
              contentContainerStyle={styles.goalListContent}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item: goal }) => {
                const progress = getGoalProgress(goal);
                const progressPct = Math.round(progress * 100);
                const accent = getGoalAccent(goal);

                return (
                  <Pressable
                    onPress={() => router.push(`/goals/detail?id=${goal.id}` as any)}
                    style={({ pressed }) => [
                      styles.goalCard,
                      { transform: [{ scale: pressed ? 0.99 : 1 }] },
                    ]}
                  >
                    <View style={styles.goalCardTop}>
                      <Text style={styles.goalEmoji}>{getGoalEmoji(goal)}</Text>
                      <View
                        style={[styles.goalProgressPill, { backgroundColor: accent + "1F" }]}
                      >
                        <Text style={[styles.goalProgressPillText, { color: accent }]}>
                          {progressPct}% complete
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.goalTitle} numberOfLines={2}>
                      {goal.title || "Untitled Goal"}
                    </Text>

                    <Text style={styles.goalDate}>
                      {goal.targetDate
                        ? `Deadline: ${new Date(goal.targetDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`
                        : "Open-ended goal"}
                    </Text>

                    <View style={styles.goalBarTrack}>
                      <View
                        style={[
                          styles.goalBarFill,
                          {
                            width: `${Math.max(progressPct, 4)}%`,
                            backgroundColor: accent,
                          },
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/track/bad-habits" as any)}
          style={({ pressed }) => [
            styles.recoveryCard,
            { transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
        >
          <View style={styles.recoveryTopRow}>
            <View style={styles.recoveryIconBox}>
              <Ionicons name="warning-outline" size={22} color={Colors.Warning} />
            </View>

            <View style={styles.recoveryPill}>
              <Text style={styles.recoveryPillText}>private</Text>
            </View>
          </View>

          <Text style={styles.recoveryOverline}>Bad Habits</Text>
          <Text style={styles.recoveryTitle}>
            {badHabits.length === 0
              ? "Start your recovery tracker"
              : hasRelapsed
                ? "Recovery reset"
                : `${bestStreakDays} clean days`}
          </Text>
          <Text style={styles.recoveryCaption}>
            {badHabits.length === 0
              ? "Tap to set up private tracking"
              : hasRelapsed
                ? "Log slip-ups and get back on track"
                : "Keep your streak alive"}
          </Text>

          <View style={styles.recoveryBarTrack}>
            <View
              style={[
                styles.recoveryBarFill,
                { width: `${Math.max(Math.round(recoveryPct * 100), 6)}%` },
              ]}
            />
          </View>
        </Pressable>
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
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  setShowFAB(false);
                  router.push(action.route as any);
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
  recoveryCard: {
    marginTop: Spacing.sm,
    borderRadius: 30,
    padding: Spacing.md,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    ...Shadows.Card,
  },
  recoveryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  recoveryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.Warning + "14",
  },
  recoveryPill: {
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.SoftSky + "32",
  },
  recoveryPillText: {
    ...Typography.Micro,
    color: Colors.SteelBlue,
    textTransform: "uppercase" as const,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
  },
  recoveryOverline: {
    ...Typography.Micro,
    color: Colors.Warning,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 2,
  },
  recoveryTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: 2,
  },
  recoveryCaption: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.md,
  },
  recoveryBarTrack: {
    height: 8,
    borderRadius: Shapes.PillButton,
    backgroundColor: Colors.SurfaceContainerLow,
    overflow: "hidden",
  },
  recoveryBarFill: {
    height: "100%",
    borderRadius: Shapes.PillButton,
    backgroundColor: Colors.Warning,
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
