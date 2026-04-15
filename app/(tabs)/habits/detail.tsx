import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { safeBack } from '@/navigation/safeBack';
import { RingProgress } from '@/components/RingProgress';
import {
  getHabitById,
  getCompletionsForHabit,
  getTodayCompletionsForHabit,
  markHabitComplete,
  calculateStreak,
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

const CATEGORY_LABELS: Record<string, string> = {
  HEALTH: 'Health', MIND: 'Mind', WORK: 'Work', PERSONAL: 'Personal', CUSTOM: 'Custom',
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily', WEEKLY: 'Weekly', X_PER_WEEK: 'X per week', EVERY_N_DAYS: 'Every N days',
};

type TabType = 'history' | 'calendar' | 'stats';

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthlyCalendar(
  completions: HabitCompletion[],
  startDate: string,
  displayMonth: Date,
) {
  const now = new Date();
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const completionSet = new Set(completions.map((c) => c.completedDate));
  const habitStart = new Date(startDate);
  const habitStartDay = new Date(habitStart.getFullYear(), habitStart.getMonth(), habitStart.getDate());

  const cells: { day: number | null; status: 'done' | 'missed' | 'future' | 'pre' }[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ day: null, status: 'pre' });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = formatDateStr(dateObj);
    if (dateObj > todayStart) {
      cells.push({ day: d, status: 'future' });
    } else if (dateObj < habitStartDay) {
      cells.push({ day: d, status: 'pre' });
    } else if (completionSet.has(dateStr)) {
      cells.push({ day: d, status: 'done' });
    } else {
      cells.push({ day: d, status: 'missed' });
    }
  }

  return {
    cells,
    monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    todayDay: isCurrentMonth ? now.getDate() : null,
  };
}

function calculateBestStreak(completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;
  const dateSet = new Set(completions.map(c => c.completedDate));
  const sortedDates = [...dateSet].sort();
  if (sortedDates.length === 0) return 0;
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

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [habit, setHabit] = useState<Habit | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [completedToday, setCompletedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalDone, setTotalDone] = useState(0);
  const [thisMonthCount, setThisMonthCount] = useState('0/0');
  const [weekCompletionPct, setWeekCompletionPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const loadData = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    const habitData = await getHabitById(id);
    if (!habitData) {
      setLoading(false);
      return;
    }
    setHabit(habitData);

    const comps = await getCompletionsForHabit(id);
    const todayComps = await getTodayCompletionsForHabit(id);
    const currentStreak = calculateStreak(comps, habitData.frequency, habitData.weekDays, habitData.timesPerWeek, habitData.everyNDays);
    const calculatedBest = calculateBestStreak(comps);

    setCompletions(comps);
    setCompletedToday(todayComps.length > 0);
    setStreak(currentStreak);
    setBestStreak(Math.max(calculatedBest, currentStreak));
    setTotalDone(comps.length);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthCompletions = comps.filter((c) => new Date(c.completedDate) >= monthStart);
    const daysInMonth = now.getDate();
    setThisMonthCount(`${monthCompletions.length}/${daysInMonth}`);

    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(formatDateStr(d));
    }
    const completionDates = new Set(comps.map(c => c.completedDate));
    const todayStr = formatDateStr(now);
    const completedDays = weekDates.filter(d => d <= todayStr && completionDates.has(d)).length;
    const daysElapsed = weekDates.filter(d => d <= todayStr).length;
    setWeekCompletionPct(daysElapsed > 0 ? completedDays / daysElapsed : 0);

    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkComplete = async () => {
    if (!id || typeof id !== 'string') return;
    await markHabitComplete(id);
    await loadData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ ...Typography.Body1, color: Colors.TextSecondary }}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!habit) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ ...Typography.Headline2, color: Colors.TextPrimary }}>Habit not found</Text>
        </View>
      </View>
    );
  }

  const cal = getMonthlyCalendar(completions, habit.createdAt, calendarMonth);
  const now = new Date();
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth();
  const viewedMonthIndex = calendarMonth.getFullYear() * 12 + calendarMonth.getMonth();
  const isAtCurrentMonth = viewedMonthIndex >= currentMonthIndex;

  const goToPreviousMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    if (isAtCurrentMonth) return;
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const categoryLabel = CATEGORY_LABELS[habit.category] || habit.category;
  const frequencyLabel = FREQUENCY_LABELS[habit.frequency] || habit.frequency;
  const iconInfo = CATEGORY_ICONS[habit.category] || CATEGORY_ICONS.CUSTOM;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/habits')} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Pressable onPress={() => router.push(`/(tabs)/habits/add-edit?id=${habit.id}` as any)} style={styles.iconBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.TextPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.SteelBlue]} />
        }
      >
        <LinearGradient
          colors={[Colors.SteelBlue, Colors.SoftSky]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.iconBadge}>
              <Ionicons name={iconInfo.name} size={28} color={Colors.Surface} />
            </View>
            <Text style={styles.heroStreak}>{streak}</Text>
            <Text style={styles.heroStreakLabel}>Day Streak</Text>
          </View>
          <View style={styles.heroDecoration} />
        </LinearGradient>

        <View style={styles.habitInfo}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <Text style={styles.habitSubtitle}>{categoryLabel} · {frequencyLabel}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>{bestStreak}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Done</Text>
            <Text style={styles.statValue}>{totalDone}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{thisMonthCount}</Text>
          </View>
        </View>

        <View style={styles.weekRingSection}>
          <RingProgress
            progress={weekCompletionPct}
            size={120}
            strokeWidth={10}
            value={`${Math.round(weekCompletionPct * 100)}%`}
            label="this week"
            color={weekCompletionPct >= 0.8 ? Colors.Success : Colors.SteelBlue}
          />
        </View>

        <View style={styles.tabBar}>
          {(['calendar', 'history', 'stats'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <View style={styles.tabItemWrapper} key={tab}>
                <Pressable onPress={() => setActiveTab(tab)}>
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.tabTextActive,
                      !isActive && styles.tabTextInactive,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
                {isActive && <View style={styles.tabIndicator} />}
              </View>
            );
          })}
        </View>

        {activeTab === 'calendar' && (
          <View style={styles.tabContent}>
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <Pressable
                  onPress={goToPreviousMonth}
                  style={({ pressed }) => [
                    styles.calendarNavBtn,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <Ionicons name="chevron-back" size={18} color={Colors.TextPrimary} />
                </Pressable>

                <View style={styles.calendarHeaderCenter}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.SteelBlue} />
                  <Text style={styles.calendarTitle}>{cal.monthName}</Text>
                </View>

                <Pressable
                  onPress={goToNextMonth}
                  disabled={isAtCurrentMonth}
                  style={({ pressed }) => [
                    styles.calendarNavBtn,
                    isAtCurrentMonth && styles.calendarNavBtnDisabled,
                    { transform: [{ scale: pressed && !isAtCurrentMonth ? 0.94 : 1 }] },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isAtCurrentMonth ? Colors.DustyTaupe : Colors.TextPrimary}
                  />
                </Pressable>
              </View>

              <View style={styles.calendarDays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLabel, idx) => (
                  <View key={`day-${idx}`} style={styles.calendarDayLabel}>
                    <Text style={styles.calendarDayLabelText}>{dayLabel}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {cal.cells.map((cell, idx) => {
                  if (!cell.day) {
                    return (
                      <View key={`empty-${idx}`} style={styles.calendarCellWrap}>
                        <View style={styles.calendarCellEmpty} />
                      </View>
                    );
                  }

                  const isToday =
                    cell.day === cal.todayDay &&
                    cell.status !== 'future' &&
                    cell.status !== 'pre';

                  return (
                    <View key={`cell-${cell.day}`} style={styles.calendarCellWrap}>
                      <View
                        style={[
                          styles.calendarCell,
                          cell.status === 'done' && styles.calendarCellDone,
                          cell.status === 'missed' && styles.calendarCellMissed,
                          cell.status === 'future' && styles.calendarCellFuture,
                          cell.status === 'pre' && styles.calendarCellPre,
                          isToday && styles.calendarCellToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarCellText,
                            (cell.status === 'future' || cell.status === 'pre') && styles.calendarCellTextMuted,
                            isToday && styles.calendarCellTextToday,
                          ]}
                        >
                          {cell.day}
                        </Text>
                        {cell.status === 'done' && <View style={styles.calendarStatusDotDone} />}
                        {cell.status === 'missed' && <View style={styles.calendarStatusDotMissed} />}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.Success }]} />
                  <Text style={styles.legendText}>Done</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.Warning }]} />
                  <Text style={styles.legendText}>Missed</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.SurfaceContainerLow }]} />
                  <Text style={styles.legendText}>Upcoming</Text>
                </View>
              </View>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIconCircle}>
                <Ionicons name="bulb" size={28} color={Colors.SteelBlue} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Insight</Text>
                <Text style={styles.insightText}>
                  {"Keep your streak going — you're "}{Math.round(weekCompletionPct * 100)}% through this week.
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            {(() => {
              const dateSet = new Set(completions.map(c => c.completedDate));
              const days: { label: string; done: boolean }[] = [];
              for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const ds = formatDateStr(d);
                days.push({ label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${i} days ago`, done: dateSet.has(ds) });
              }
              return days.map((entry) => (
                <View
                  key={entry.label}
                  style={[
                    styles.historyRow,
                    entry.done && styles.historyRowDone,
                  ]}
                >
                  <Text style={[
                    styles.historyDay,
                    !entry.done && styles.historyDayMissed,
                  ]}>
                    {entry.label}
                  </Text>
                  <Ionicons
                    name={entry.done ? 'checkmark-circle' : 'close-circle-outline'}
                    size={24}
                    color={entry.done ? Colors.Success : Colors.Danger}
                  />
                </View>
              ));
            })()}
          </View>
        )}

        {activeTab === 'stats' && (
          <View style={styles.tabContent}>
            <View style={styles.statsDetailCard}>
              {[
                { label: 'Category', value: categoryLabel },
                { label: 'Frequency', value: frequencyLabel },
                { label: 'Completion Rate', value: totalDone > 0 ? `${Math.round((totalDone / Math.max(totalDone, 30)) * 100)}%` : '0%' },
                { label: 'Current Streak', value: `${streak} days` },
                { label: 'Best Streak', value: `${bestStreak} days` },
                { label: 'Total Completions', value: `${totalDone}` },
              ].map((row) => (
                <View key={row.label} style={styles.statsDetailRow}>
                  <Text style={styles.statsDetailLabel}>{row.label}</Text>
                  <Text style={styles.statsDetailValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionSection}>
          <Text style={styles.actionTitle}>Quick Actions</Text>
          {!completedToday ? (
            <View style={styles.ctaContainer}>
              <LinearGradient
                colors={[Colors.SteelBlue, Colors.TextPrimary]}
                start={[0, 0]}
                end={[1, 0]}
                style={styles.ctaButton}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.ctaPressable,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                  onPress={handleMarkComplete}
                >
                  <Ionicons name="checkmark-circle" size={20} color={Colors.Surface} style={styles.ctaIcon} />
                  <Text style={styles.ctaText}>Mark as Complete Today</Text>
                </Pressable>
              </LinearGradient>
            </View>
          ) : (
            <View style={styles.ctaContainer}>
              <View style={styles.completedBanner}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.Success} />
                <Text style={styles.completedText}>Completed today</Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
  },
  iconBtn: {
    padding: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
  },
  heroGradient: {
    borderRadius: Shapes.HeroCard,
    overflow: 'hidden',
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    ...Shadows.HeroCard,
  },
  heroContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.Surface + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroStreak: {
    ...Typography.Stat,
    color: Colors.Surface,
  },
  heroStreakLabel: {
    ...Typography.Caption,
    color: Colors.Surface,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.9,
    marginTop: 4,
  },
  heroDecoration: {
    position: 'absolute',
    right: -48,
    bottom: -48,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: Colors.Surface + '15',
  },
  habitInfo: {
    marginTop: Spacing.lg,
  },
  habitName: {
    ...Typography.Display,
    color: Colors.TextPrimary,
  },
  habitSubtitle: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.WarmSand + '60',
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    ...Typography.Headline1,
    color: Colors.SteelBlue,
    fontSize: 22,
  },
  weekRingSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  tabItemWrapper: {
    position: 'relative',
    paddingBottom: Spacing.sm,
  },
  tabText: {
    ...Typography.Caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tabTextActive: {
    color: Colors.SteelBlue,
  },
  tabTextInactive: {
    color: Colors.TextSecondary,
    opacity: 0.5,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.SteelBlue,
    borderRadius: 2,
  },
  tabContent: {
    gap: Spacing.md,
  },
  calendarCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    padding: Spacing.lg,
    ...Shadows.Card,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calendarHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WarmSand + '60',
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },
  calendarNavBtnDisabled: {
    opacity: 0.5,
  },
  calendarTitle: {
    ...Typography.Body1,
    fontWeight: '700',
    color: Colors.TextPrimary,
  },
  calendarDays: {
    flexDirection: 'row',
    marginBottom: Spacing.xs + 2,
  },
  calendarDayLabel: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayLabelText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCellWrap: {
    width: `${100 / 7}%` as any,
    padding: 2,
  },
  calendarCell: {
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    overflow: 'hidden',
  },
  calendarCellEmpty: {
    aspectRatio: 1,
  },
  calendarCellDone: {
    backgroundColor: Colors.Success + '16',
    borderColor: Colors.Success + '40',
  },
  calendarCellMissed: {
    backgroundColor: Colors.Warning + '14',
    borderColor: Colors.Warning + '38',
  },
  calendarCellFuture: {
    backgroundColor: Colors.SurfaceContainerLow,
    borderColor: Colors.BorderSubtle,
  },
  calendarCellPre: {
    backgroundColor: Colors.WarmSand + '70',
    borderColor: Colors.BorderSubtle,
  },
  calendarCellToday: {
    borderColor: Colors.SteelBlue,
    borderWidth: 2,
  },
  calendarCellText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  calendarCellTextMuted: {
    color: Colors.DustyTaupe,
  },
  calendarCellTextToday: {
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  calendarStatusDotDone: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.Success,
  },
  calendarStatusDotMissed: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.Warning,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.WarmSand + '55',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Chip,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
  },
  actionSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  insightCard: {
    backgroundColor: Colors.WarmSand + '60',
    borderRadius: Shapes.Card,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insightIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: Colors.SoftSky,
    backgroundColor: Colors.Surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.Body1,
    fontWeight: '700',
    color: Colors.SteelBlue,
    marginBottom: 2,
  },
  insightText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    ...Shadows.Card,
  },
  historyRowDone: {
    backgroundColor: Colors.Success + '08',
    borderLeftWidth: 3,
    borderLeftColor: Colors.Success,
  },
  historyDay: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  historyDayMissed: {
    color: Colors.Danger,
  },
  statsDetailCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    overflow: 'hidden',
    ...Shadows.Card,
  },
  statsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle,
  },
  statsDetailLabel: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  statsDetailValue: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  ctaContainer: {
    width: '100%',
  },
  ctaButton: {
    borderRadius: Shapes.Button,
    overflow: 'hidden',
    ...Shadows.HeroCard,
  },
  ctaPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  ctaIcon: {
    flexShrink: 0,
  },
  ctaText: {
    ...Typography.Caption,
    fontWeight: '800',
    color: Colors.Surface,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: Shapes.Button,
    backgroundColor: Colors.Success + '15',
    borderWidth: 1.5,
    borderColor: Colors.Success + '40',
  },
  completedText: {
    ...Typography.Caption,
    color: Colors.Success,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
