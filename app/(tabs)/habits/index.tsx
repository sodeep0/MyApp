import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LoadingState } from '@/components/LoadingState';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { RingProgress } from '@/components/RingProgress';
import {
  getAllHabits,
  getTodayCompletionsForHabit,
  markHabitComplete,
  unmarkHabitComplete,
  calculateStreak,
  isHabitAtRisk,
  getCompletionsForHabit,
} from '@/stores/habitStore';
import type { Habit, HabitCompletion } from '@/types/models';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICONS: Record<string, { name: IoniconName; bg: string; color: string }> = {
  HEALTH: { name: 'fitness-outline', bg: Colors.SoftSky + '30', color: Colors.SteelBlue },
  MIND: { name: 'leaf-outline', bg: Colors.Success + '20', color: Colors.Success },
  WORK: { name: 'laptop-outline', bg: Colors.WarmSand, color: Colors.DustyTaupe },
  PERSONAL: { name: 'heart-outline', bg: Colors.SteelBlue + '15', color: Colors.SteelBlue },
  CUSTOM: { name: 'star-outline', bg: Colors.WarmSand, color: Colors.DustyTaupe },
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const FILTER_CHIPS = ['All', 'Morning', 'Evening', 'Health', 'Work'];

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getCurrentWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDateStr(d));
  }
  return dates;
}

function getBestStreakLocal(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;
  const dateSet = new Set(completions.map(c => c.completedDate));
  const sortedDates = [...dateSet].sort();
  let bestStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return bestStreak;
}

interface WeekData {
  dots: boolean[];
  completionPct: number;
  bestStreak: number;
  streak: number;
  completedToday: boolean;
  atRisk: boolean;
}

function HabitCard({
  habit,
  weekData,
  onPress,
  onToggle,
  disabled = false,
}: {
  habit: Habit;
  weekData: WeekData;
  onPress: () => void;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const iconInfo = CATEGORY_ICONS[habit.category] || CATEGORY_ICONS.CUSTOM;

  return (
    <View style={[styles.habitCard, weekData.atRisk && styles.habitCardAtRisk]}>
      <View style={styles.habitCardTop}>
        <View style={styles.habitCardLeft}>
          <Pressable onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
              <Ionicons name={iconInfo.name} size={24} color={iconInfo.color} />
            </View>
          </Pressable>
          <Pressable onPress={onPress} style={styles.habitInfo}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <View style={styles.habitMeta}>
              <Text style={styles.frequencyText}>
                {habit.frequency === 'DAILY' ? 'Daily' : habit.frequency === 'WEEKLY' ? 'Weekly' : habit.frequency === 'X_PER_WEEK' ? `${habit.timesPerWeek}x/week` : 'Custom'}
              </Text>
              {weekData.streak > 0 && (
                <View style={styles.streakMeta}>
                  <Ionicons name="flame" size={14} color={Colors.Warning} />
                  <Text style={styles.streakText}>{weekData.streak} day streak</Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>
        <Pressable onPress={onToggle} style={styles.toggleBtn} disabled={disabled}>
          <Ionicons
            name={weekData.completedToday ? 'checkmark-circle' : 'ellipse-outline'}
            size={32}
            color={weekData.completedToday ? Colors.Success : Colors.DustyTaupe}
          />
        </Pressable>
      </View>

      {weekData.atRisk && (
        <View style={styles.atRiskBadge}>
          <Ionicons name="warning" size={12} color={Colors.Danger} />
          <Text style={styles.atRiskText}>STREAK AT RISK</Text>
        </View>
      )}

      <View style={styles.habitCardMiddle}>
        <View style={styles.weekDotsContainer}>
          {DAY_LABELS.map((label, idx) => (
            <View key={idx} style={styles.weekDotColumn}>
              <Text style={styles.weekDotLabel}>{label}</Text>
              <View
                style={[
                  styles.weekDot,
                  weekData.dots[idx] && styles.weekDotCompleted,
                  !weekData.dots[idx] && styles.weekDotEmpty,
                ]}
              />
            </View>
          ))}
        </View>
        {weekData.bestStreak > 0 && (
          <View style={styles.bestStreakStat}>
            <Ionicons name="trophy-outline" size={16} color={Colors.Warning} />
            <Text style={styles.bestStreakLabel}>Best</Text>
            <Text style={styles.bestStreakValue}>{weekData.bestStreak}</Text>
          </View>
        )}
      </View>

      <View style={styles.habitCardBottom}>
        <View style={styles.ringContainer}>
          <RingProgress
            progress={weekData.completionPct}
            size={72}
            strokeWidth={6}
            value={`${Math.round(weekData.completionPct * 100)}%`}
            label="this week"
            color={weekData.completionPct >= 0.8 ? Colors.Success : Colors.SteelBlue}
          />
        </View>
        <Pressable onPress={onPress} style={styles.viewDetailsLink}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.SteelBlue} />
        </Pressable>
      </View>
    </View>
  );
}

export default function HabitListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedChip, setSelectedChip] = useState('All');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekDataMap, setWeekDataMap] = useState<Record<string, WeekData>>({});
  const [loading, setLoading] = useState(true);
  const [pendingToggleIds, setPendingToggleIds] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const habitsData = await getAllHabits();
      const sortedHabits = [...habitsData].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setHabits(sortedHabits);

      const weekDates = getCurrentWeekDates();
      const today = formatDateStr(new Date());
      const dataMap: Record<string, WeekData> = {};

      await Promise.all(
        sortedHabits.map(async (habit) => {
          const completions = await getCompletionsForHabit(habit.id);
          const todayComps = await getTodayCompletionsForHabit(habit.id);
          const completionDates = new Set(completions.map((c) => c.completedDate));

          const dots = weekDates.map((date) => completionDates.has(date));
          const completedDays = dots.filter((d) => d).length;
          const daysElapsed = weekDates.filter((d) => d <= today).length;
          const completionPct = daysElapsed > 0 ? completedDays / daysElapsed : 0;

          const streak = calculateStreak(
            completions,
            habit.frequency,
            habit.weekDays,
            habit.timesPerWeek,
            habit.everyNDays,
          );
          const bestStreak = getBestStreakLocal(completions);

          dataMap[habit.id] = {
            dots,
            completionPct,
            bestStreak,
            streak,
            completedToday: todayComps.length > 0,
            atRisk: isHabitAtRisk(habit, completions),
          };
        }),
      );

      setWeekDataMap(dataMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleToggle = async (habitId: string) => {
    if (pendingToggleIds[habitId]) return;

    const data = weekDataMap[habitId];
    if (!data) return;

    const weekDates = getCurrentWeekDates();
    const today = formatDateStr(new Date());
    const todayIdx = weekDates.indexOf(today);
    const nextCompletedToday = !data.completedToday;
    const nextDots = [...data.dots];
    if (todayIdx >= 0) {
      nextDots[todayIdx] = nextCompletedToday;
    }
    const daysElapsed = weekDates.filter((d) => d <= today).length;
    const completedDays = nextDots.filter((done, idx) => done && weekDates[idx] <= today).length;
    const nextCompletionPct = daysElapsed > 0 ? completedDays / daysElapsed : 0;

    setWeekDataMap((prev) => ({
      ...prev,
      [habitId]: {
        ...data,
        completedToday: nextCompletedToday,
        dots: nextDots,
        completionPct: nextCompletionPct,
        atRisk: false,
      },
    }));
    setPendingToggleIds((prev) => ({ ...prev, [habitId]: true }));

    try {
      if (data.completedToday) {
        await unmarkHabitComplete(habitId);
      } else {
        await markHabitComplete(habitId);
      }
    } catch {
      setWeekDataMap((prev) => ({ ...prev, [habitId]: data }));
    } finally {
      setPendingToggleIds((prev) => {
        const next = { ...prev };
        delete next[habitId];
        return next;
      });
      void loadData();
    }
  };

  const filteredHabits = habits.filter((habit) => {
    if (selectedChip === 'All') return true;
    if (selectedChip === 'Morning') return habit.reminderTime != null && habit.reminderTime < '12:00';
    if (selectedChip === 'Evening') return habit.reminderTime != null && habit.reminderTime >= '12:00';
    if (selectedChip === 'Health') return habit.category === 'HEALTH';
    if (selectedChip === 'Work') return habit.category === 'WORK';
    return true;
  });

  const totalCount = habits.length;

  if (loading) {
    return (
      <LoadingState
        fullScreen
        title="Loading Habits"
        message="Refreshing streaks, weekly progress, and today&apos;s checkmarks."
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Habits</Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipContainer}
          contentContainerStyle={styles.chipContent}
        >
          {FILTER_CHIPS.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => setSelectedChip(chip)}
              style={[
                styles.chip,
                selectedChip === chip && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  selectedChip === chip && styles.chipLabelSelected,
                ]}
              >
                {chip}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {totalCount === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              <Ionicons name="calendar-outline" size={72} color={Colors.DustyTaupe} />
              <View style={styles.emptyFigure}>
                <Ionicons name="person-outline" size={28} color={Colors.DustyTaupe} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No habits yet.</Text>
            <Text style={styles.emptySubtext}>Start building positive routines that stick.</Text>
            <View style={styles.emptyCTA}>
              <Button
                label="Build your first habit"
                onPress={() => router.push('/(tabs)/habits/add-edit' as any)}
                fullWidth
              />
            </View>
          </View>
        ) : (
          <View style={styles.habitList}>
            {filteredHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                weekData={weekDataMap[habit.id] || { dots: [false,false,false,false,false,false,false], completionPct: 0, bestStreak: 0, streak: 0, completedToday: false, atRisk: false }}
                onPress={() => router.push(`/(tabs)/habits/detail?id=${habit.id}` as any)}
                onToggle={() => handleToggle(habit.id)}
                disabled={Boolean(pendingToggleIds[habit.id])}
              />
            ))}
            {filteredHabits.length === 0 && (
              <View style={styles.emptyFilterState}>
                <Ionicons name="filter-outline" size={40} color={Colors.DustyTaupe} />
                <Text style={styles.emptyFilterText}>No habits match this filter</Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Pressable
        onPress={() => router.push('/(tabs)/habits/add-edit' as any)}
        style={{
          position: 'absolute',
          right: Spacing.screenH + 22,
          bottom: insets.bottom + 70,
        }}
      >
        <View style={styles.fabCircle}>
          <Ionicons name="add" size={27} color={Colors.Surface} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    ...CommonStyles.listHeader,
  },
  headerLeft: {
    ...CommonStyles.listHeaderLeft,
  },
  headerTitle: {
    ...CommonStyles.listHeaderTitle,
  },
  headerSubtitle: {
    ...CommonStyles.listHeaderSubtitle,
  },
  scrollContent: {
    ...CommonStyles.listContent,
    paddingBottom: Spacing.md,
  },
  chipContainer: {
    ...CommonStyles.filterChipRowContainer,
  },
  chipContent: {
    ...CommonStyles.filterChipRowContent,
  },
  chip: {
    ...CommonStyles.filterChip,
  },
  chipSelected: {
    ...CommonStyles.filterChipSelected,
  },
  chipLabel: {
    ...CommonStyles.filterChipLabel,
  },
  chipLabelSelected: {
    ...CommonStyles.filterChipLabelSelected,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  emptyFigure: {
    position: 'absolute',
    bottom: 16,
    right: 12,
  },
  emptyTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyCTA: {
    width: '100%',
    maxWidth: 280,
  },
  emptyFilterState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyFilterText: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
  },
  habitList: {
    gap: Spacing.md,
  },
  habitCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    ...Shadows.Card,
  },
  habitCardAtRisk: {
    borderColor: Colors.Danger + '20',
    borderWidth: 1.5,
  },
  habitCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  habitCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  frequencyText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  streakMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.Success,
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
  },
  streakText: {
    ...Typography.Micro,
    color: Colors.Surface,
    fontWeight: '700' as const,
  },
  toggleBtn: {
    padding: 2,
  },
  atRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.Danger + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
    marginBottom: Spacing.sm,
    alignSelf: 'flex-start',
  },
  atRiskText: {
    ...Typography.Micro,
    color: Colors.Danger,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  habitCardMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  weekDotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  weekDotColumn: {
    alignItems: 'center',
    gap: 4,
  },
  weekDotLabel: {
    ...Typography.Micro,
    color: Colors.TextMuted,
    fontWeight: '600',
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  weekDotCompleted: {
    backgroundColor: Colors.Success,
  },
  weekDotEmpty: {
    backgroundColor: Colors.DustyTaupe,
  },
  bestStreakStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.WarmSand + '60',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
  },
  bestStreakLabel: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  bestStreakValue: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  habitCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    marginTop: Spacing.sm,
  },
  ringContainer: {
    flexShrink: 0,
    marginRight: Spacing.sm,
  },
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  fabCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.TextPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.FAB,
  },
});
