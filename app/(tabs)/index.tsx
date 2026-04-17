import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card } from "../../components/Card";
import { RingProgress } from "../../components/RingProgress";
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
import { type BadHabit, type Goal, type Habit } from "../../types/models";

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

const DAILY_PROMPTS = [
  "What's one thing you're grateful for today?",
  "How are you feeling right now?",
  "What would make today a win?",
  "Describe your energy level in one word.",
  "What challenge did you overcome recently?",
  "What intention do you want to set for tomorrow?",
  "What's something that brought you joy this week?",
];

function getDailyPrompt() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
}

function AnimatedPressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

function HabitRow({
  habit,
  completed,
  streak,
  onPress,
  onToggle,
}: {
  habit: Habit;
  completed: boolean;
  streak: number;
  onPress: () => void;
  onToggle: () => void;
}) {
  const habitColor = habit.colorHex || Colors.SteelBlue;

  return (
    <Pressable onPress={onPress} style={styles.habitRow}>
      <View style={[styles.habitColorDot, { backgroundColor: habitColor }]} />

      <View style={styles.habitInfo}>
        <Text
          style={[styles.habitName, completed && styles.habitNameDone]}
          numberOfLines={1}
        >
          {habit.name || "Untitled Habit"}
        </Text>
      </View>

      {streak > 0 && (
        <View style={styles.habitStreak}>
          <Ionicons name="flame" size={12} color={Colors.Surface} />
          <Text style={styles.habitStreakText}>{streak}d</Text>
        </View>
      )}

      <Pressable onPress={onToggle} style={styles.habitToggle} hitSlop={8}>
        {completed ? (
          <Ionicons name="checkmark-circle" size={22} color={Colors.Success} />
        ) : (
          <Ionicons
            name="ellipse-outline"
            size={22}
            color={Colors.DustyTaupe}
          />
        )}
      </Pressable>
    </Pressable>
  );
}

const QUICK_ACTIONS = [
  {
    label: "+Habit",
    icon: "add-circle-outline",
    route: "/(tabs)/habits/add-edit" as const,
  },
  {
    label: "+Log",
    icon: "pencil-outline",
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
  const [todayDone, setTodayDone] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [badHabits, setBadHabits] = useState<BadHabit[]>([]);
  const [bestStreakDays, setBestStreakDays] = useState<number>(0);
  const [hasRelapsed, setHasRelapsed] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setShowFAB(false);
      };
    }, []),
  );

  const loadAllData = async () => {
    const [habitsData, goalsData, badHabitsData] = await Promise.all([
      getAllHabits(),
      getAllGoals(),
      getAllBadHabits(),
    ]);
    setHabits(habitsData);
    setGoals(goalsData);
    setBadHabits(badHabitsData);

    const doneSet = new Set<string>();
    const streakMap: Record<string, number> = {};
    await Promise.all(
      habitsData.map(async (habit) => {
        const done = await getTodayCompletionsForHabit(habit.id);
        if (done.length > 0) {
          doneSet.add(habit.id);
        }
        const completions = await getCompletionsForHabit(habit.id);
        const streak = calcStreak(
          completions,
          habit.frequency,
          habit.weekDays,
          habit.timesPerWeek,
          habit.everyNDays,
        );
        streakMap[habit.id] = streak;
      }),
    );
    setTodayDone(doneSet);
    setStreaks(streakMap);

    if (badHabitsData.length > 0) {
      let bestDays = 0;
      let anyRelapsed = false;
      await Promise.all(
        badHabitsData.map(async (bh) => {
          const events = await getAllUrgeEvents();
          const relapseEvents = events.filter(
            (e) => e.badHabitId === bh.id && e.type === "RELAPSE",
          );
          if (relapseEvents.length > 0) anyRelapsed = true;
          const days = daysSinceQuit(bh.quitDate);
          if (days > bestDays) bestDays = days;
        }),
      );
      setBestStreakDays(bestDays);
      setHasRelapsed(anyRelapsed);
    }
  };

  const completedCount = todayDone.size;
  const totalHabits = habits.length;
  const progress = totalHabits > 0 ? completedCount / totalHabits : 0;
  const displayNameStr = String(displayName).split(" ")[0] || "User";
  const maxStreak =
    Object.values(streaks).length > 0 ? Math.max(...Object.values(streaks)) : 0;
  const recoveryProgress = Math.min(bestStreakDays / 30, 1);
  const recoveryPct = Math.round(recoveryProgress * 100);
  const recentHabits = [...habits]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const toggleComplete = async (habitId: string) => {
    if (todayDone.has(habitId)) {
      await unmarkHabitComplete(habitId);
      setTodayDone((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    } else {
      await markHabitComplete(habitId);
      setTodayDone((prev) => {
        const next = new Set(prev);
        next.add(habitId);
        return next;
      });
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
  };

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Bar ──────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting(displayNameStr)}</Text>
          <Text style={styles.dateText}>{getDateString()}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} hitSlop={8}>
            <Ionicons
              name="notifications-outline"
              size={28}
              color={Colors.TextPrimary}
            />
          </Pressable>
          <AnimatedPressable
            onPress={() => router.push("/profile" as any)}
            style={styles.avatar}
          >
            <Ionicons name="person" size={18} color={Colors.SteelBlue} />
          </AnimatedPressable>
        </View>
      </View>

      {/* ── Scrollable Content ───────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Daily Score Hero Card ────────────────── */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[Colors.SteelBlue, Colors.TextPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <RingProgress
              progress={progress}
              size={160}
              strokeWidth={10}
              value={`${Math.round(progress * 100)}%`}
              label={"Today's Score"}
              color={Colors.Surface}
              trackColor={Colors.DustyTaupe}
              light
            />
            <View style={styles.miniStatsRow}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{completedCount}</Text>
                <Text style={styles.miniStatLabel}>HABITS DONE</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>{maxStreak}</Text>
                <Text style={styles.miniStatLabel}>STREAK</Text>
              </View>
              <View style={styles.miniStatDivider} />
              <View style={styles.miniStat}>
                <Text style={styles.miniStatValue}>2h</Text>
                <Text style={styles.miniStatLabel}>FOCUS TIME</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Quick Action Row ────────────────────── */}
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                router.push(action.route as any);
              }}
              style={({ pressed }) => [
                styles.quickActionWrapper,
                {
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <View style={styles.quickActionCard}>
                <Ionicons
                  name={action.icon as any}
                  size={20}
                  color={Colors.SteelBlue}
                />
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Today's Habits ───────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCaptionTitle}>{"TODAY'S HABITS"}</Text>
            <AnimatedPressable
              onPress={() => router.push("/(tabs)/habits" as any)}
            >
              <View style={styles.seeAll}>
                <Text style={styles.seeAllText}>See all</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.SteelBlue}
                />
              </View>
            </AnimatedPressable>
          </View>

          <View style={styles.habitList}>
            {habits.length === 0 && (
              <View
                style={{ paddingVertical: Spacing.md, alignItems: "center" }}
              >
                <Ionicons
                  name="time-outline"
                  size={40}
                  color={Colors.DustyTaupe}
                />
                <Text
                  style={{
                    ...Typography.Body1,
                    color: Colors.TextSecondary,
                    marginTop: Spacing.sm,
                  }}
                >
                  No habits yet
                </Text>
                <Text
                  style={{
                    ...Typography.Body2,
                    color: Colors.TextSecondary,
                    marginTop: Spacing.xs,
                  }}
                >
                  Create your first habit to get started
                </Text>
              </View>
            )}
            {recentHabits.map((habit) => {
              const completed = todayDone.has(habit.id);
              const streak = streaks[habit.id] || 0;
              return (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  completed={completed}
                  streak={streak}
                  onPress={() =>
                    router.push(`/habits/detail?id=${habit.id}` as any)
                  }
                  onToggle={() => toggleComplete(habit.id)}
                />
              );
            })}
          </View>
        </View>

        {/* ── Bad Habit Tracker Snapshot ──────────── */}
        {badHabits.length > 0 && (
          <View style={styles.badHabitSection}>
            <Pressable
              onPress={() => router.push("/(tabs)/track/bad-habits" as any)}
              style={({ pressed }) => [
                styles.badHabitCardWrapper,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Card style={styles.badHabitCard} padding={Spacing.md}>
                <View style={styles.badHabitCategoryBadge}>
                  <Text style={styles.badHabitCategoryText}>RECOVERY TRACKER</Text>
                </View>
                <Text style={styles.badHabitCardTitle} numberOfLines={2}>
                  {hasRelapsed ? "Bounce back from relapse" : `${bestStreakDays} days clean`}
                </Text>
                <View style={styles.badHabitProgress}>
                  <View style={styles.badHabitBarBg}>
                    <View
                      style={[
                        styles.badHabitBarFill,
                        {
                          width: `${Math.max(hasRelapsed ? 6 : recoveryPct, 6)}%`,
                          backgroundColor: hasRelapsed ? Colors.Danger : Colors.Success,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.badHabitProgressText}>
                    {hasRelapsed ? "Reset" : `${recoveryPct}%`}
                  </Text>
                </View>
                <View style={styles.badHabitFooter}>
                  <Text style={styles.badHabitSubtext}>
                    {hasRelapsed
                      ? "Restart your streak and keep moving"
                      : `${badHabits.length} habits tracked`}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.TextSecondary}
                  />
                </View>
              </Card>
            </Pressable>
          </View>
        )}

        {/* ── Journal Prompt Card ──────────────────── */}
        <View style={styles.journalSection}>
          <Card style={styles.journalCard} padding={Spacing.lg}>
            <Ionicons
              name="book-outline"
              size={20}
              color={Colors.DustyTaupe}
              style={{ marginBottom: Spacing.sm }}
            />
            <Text style={styles.journalPrompt}>{getDailyPrompt()}</Text>
            <AnimatedPressable
              onPress={() => router.push("/(tabs)/track/journal" as any)}
              style={{ marginTop: Spacing.md }}
            >
              <View style={styles.journalButton}>
                <Text style={styles.journalButtonText}>Write Entry</Text>
              </View>
            </AnimatedPressable>
          </Card>
        </View>

        {/* ── Goal Progress Row ────────────────────── */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCaptionTitle}>GOALS IN PROGRESS</Text>
              <AnimatedPressable
                onPress={() => router.push("/(tabs)/goals" as any)}
              >
                <View style={styles.seeAll}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={Colors.SteelBlue}
                  />
                </View>
              </AnimatedPressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
              contentContainerStyle={styles.carouselContent}
            >
              {activeGoals.map((goal) => {
                const goalProgress =
                  goal.goalType === "QUANTITATIVE" && goal.targetValue
                    ? Math.min(goal.currentValue / goal.targetValue, 1)
                    : 0;
                const pct = Math.round(goalProgress * 100);
                return (
                  <Pressable
                    key={goal.id}
                    onPress={() =>
                      router.push(`/goals/detail?id=${goal.id}` as any)
                    }
                    style={({ pressed }) => [
                      styles.carouselCardWrapper,
                      { transform: [{ scale: pressed ? 0.98 : 1 }] },
                    ]}
                  >
                    <Card padding={Spacing.md} style={styles.goalCarouselCard}>
                      <View style={styles.goalCategoryBadge}>
                        <Text
                          style={[
                            styles.goalCategoryText,
                            { color: Colors.TextPrimary },
                          ]}
                        >
                          {goal.category.toLowerCase()}
                        </Text>
                      </View>
                      <Text style={styles.goalCardTitle} numberOfLines={2}>
                        {goal.title || "Untitled Goal"}
                      </Text>
                      {goal.goalType === "QUANTITATIVE" && goal.targetValue && (
                        <View style={styles.goalCardProgress}>
                          <View style={styles.goalBarBg}>
                            <View
                              style={[
                                styles.goalBarFill,
                                { width: `${Math.max(pct, 4)}%` },
                              ]}
                            />
                          </View>
                          <Text style={styles.goalCardProgressText}>
                            {pct}%
                          </Text>
                        </View>
                      )}
                      {goal.targetDate && (
                        <Text style={styles.goalDueDate}>
                          Due{" "}
                          {new Date(goal.targetDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </Text>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Quick Add FAB: Bottom-right ──────────────────── */}
      <AnimatedPressable
        onPress={() => setShowFAB(true)}
        style={{
          position: "absolute",
          right: Spacing.screenH + 22,
          bottom: insets.bottom + 70,
        }}
      >
        <View style={styles.fabCircle}>
          <Ionicons name="add" size={27} color={Colors.Surface} />
        </View>
      </AnimatedPressable>

      {/* ── FAB Modal ────────────────────────────────── */}
      <Modal
        visible={showFAB}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFAB(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowFAB(false)}
        >
          <View style={styles.fabSheet}>
            <AnimatedPressable
              onPress={() => {
                setShowFAB(false);
                router.push("/(tabs)/habits/add-edit" as any);
              }}
            >
              <View style={styles.sheetOption}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={Colors.SteelBlue}
                />
                <Text style={styles.sheetOptionText}>Check in a habit</Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                setShowFAB(false);
                router.push("/(tabs)/track/journal" as any);
              }}
            >
              <View style={styles.sheetOption}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={Colors.SteelBlue}
                />
                <Text style={styles.sheetOptionText}>Journal entry</Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                setShowFAB(false);
                router.push("/(tabs)/track/activity" as any);
              }}
            >
              <View style={styles.sheetOption}>
                <Ionicons
                  name="footsteps-outline"
                  size={22}
                  color={Colors.SteelBlue}
                />
                <Text style={styles.sheetOptionText}>Log activity</Text>
              </View>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                setShowFAB(false);
                router.push("/(tabs)/goals/add-edit" as any);
              }}
            >
              <View style={[styles.sheetOption, { borderBottomWidth: 0 }]}>
                <Ionicons
                  name="flag-outline"
                  size={22}
                  color={Colors.SteelBlue}
                />
                <Text style={styles.sheetOptionText}>Create a goal</Text>
              </View>
            </AnimatedPressable>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: "700",
  },
  dateText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerBtn: {
    padding: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.SteelBlue + "18",
    justifyContent: "center",
    alignItems: "center",
  },

  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // ── Daily Score Hero Card ────────────────────────────
  heroCard: {
    marginHorizontal: Spacing.screenH,
    marginBottom: Spacing.md,
    borderRadius: Shapes.HeroCard,
    overflow: "hidden",
    ...Shadows.HeroCard,
  },
  heroGradient: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  miniStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  miniStat: {
    alignItems: "center",
    flex: 1,
  },
  miniStatValue: {
    ...Typography.Stat,
    color: Colors.Surface,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  miniStatLabel: {
    ...Typography.Caption,
    color: Colors.Surface + "CC",
    marginTop: 2,
    letterSpacing: 0.8,
  },
  miniStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.Surface + "30",
  },

  // ── Quick Action Row ─────────────────────────────────
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenH,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickActionWrapper: {
    flex: 1,
  },
  quickActionCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.QuickAction,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    ...Shadows.QuickAction,
  },
  quickActionLabel: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: "600" as const,
    textAlign: "center",
  },

  // ── Section Layout ────────────────────────────────────
  section: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenH,
    marginBottom: Spacing.sm,
  },
  sectionCaptionTitle: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    ...Typography.Body2,
    color: Colors.SteelBlue,
    fontWeight: "500" as const,
  },

  // ── Habit Row ────────────────────────────────────────
  habitList: {
    paddingHorizontal: Spacing.screenH,
  },
  habitRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.Card,
  },
  habitColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  habitInfo: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  habitName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "500" as const,
  },
  habitNameDone: {
    color: Colors.TextSecondary,
    textDecorationLine: "line-through" as const,
  },
  habitStreak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginRight: Spacing.sm,
    backgroundColor: Colors.Success,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
  },
  habitStreakText: {
    ...Typography.Micro,
    color: Colors.Surface,
    fontWeight: "700" as const,
  },
  habitToggle: {
    padding: 2,
  },

  // ── Bad Habit Tracker Snapshot ────────────────────────
  badHabitSection: {
    paddingHorizontal: Spacing.screenH,
    marginBottom: Spacing.md,
  },
  badHabitCardWrapper: {
    borderRadius: Shapes.Card,
  },
  badHabitCard: {
    borderRadius: Shapes.Card,
  },
  badHabitCategoryBadge: {
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.WarmSand,
    alignSelf: "flex-start",
    marginBottom: Spacing.xs,
  },
  badHabitCategoryText: {
    ...Typography.Micro,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    color: Colors.TextPrimary,
  },
  badHabitCardTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.sm,
  },
  badHabitProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  badHabitBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.PillButton,
    overflow: "hidden",
  },
  badHabitBarFill: {
    height: "100%",
    borderRadius: Shapes.PillButton,
  },
  badHabitProgressText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "600" as const,
    minWidth: 40,
    textAlign: "right" as const,
  },
  badHabitFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  badHabitSubtext: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    flex: 1,
  },

  // ── Journal Prompt Card ──────────────────────────────
  journalSection: {
    paddingHorizontal: Spacing.screenH,
    marginBottom: Spacing.md,
  },
  journalCard: {
    backgroundColor: Colors.WarmSand,
    borderColor: "#E8D5C0",
    borderWidth: 1,
    borderRadius: Shapes.HeroCard,
  },
  journalPrompt: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    fontStyle: "italic" as const,
    lineHeight: 24,
  },
  journalButton: {
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderColor: Colors.SteelBlue,
    borderRadius: Shapes.Button,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  journalButtonText: {
    ...Typography.Body2,
    color: Colors.SteelBlue,
    fontWeight: "600" as const,
  },

  // ── Goals Carousel ────────────────────────────────────
  carousel: {
    marginTop: Spacing.xs,
  },
  carouselContent: {
    paddingLeft: Spacing.screenH,
    paddingRight: Spacing.screenH - Spacing.sm,
  },
  carouselCardWrapper: {
    width: 260,
    marginRight: Spacing.sm,
  },
  goalCarouselCard: {
    borderRadius: Shapes.Card,
  },
  goalCategoryBadge: {
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.WarmSand,
    alignSelf: "flex-start",
    marginBottom: Spacing.xs,
  },
  goalCategoryText: {
    ...Typography.Micro,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
  },
  goalCardTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.sm,
  },
  goalCardProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  goalBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.PillButton,
    overflow: "hidden",
  },
  goalBarFill: {
    height: "100%",
    backgroundColor: Colors.SteelBlue,
    borderRadius: Shapes.PillButton,
  },
  goalCardProgressText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "600" as const,
    minWidth: 36,
    textAlign: "right" as const,
  },
  goalDueDate: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    backgroundColor: Colors.BorderSubtle,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.Chip,
    alignSelf: "flex-start",
    overflow: "hidden",
  },

  // ── FAB ─────────────────────────────────────────────
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.TextPrimary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.FAB,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.OverlayLight,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  fabSheet: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.BottomSheet,
    ...Shadows.Modal,
    width: "90%",
    maxWidth: 360,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle,
  },
  sheetOptionText: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "500" as const,
  },
});
