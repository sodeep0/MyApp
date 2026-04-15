import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { safeBack } from '@/navigation/safeBack';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { getBadHabitById, getUrgeEventsForHabit, logUrgeEvent, daysSinceQuit } from '@/stores/badHabitStore';
import {
  UrgeEventType,
  type BadHabit,
  type UrgeEvent,
} from '@/types/models';
import RelapseSheet from './relapse-sheet';

const CATEGORY_LABELS: Record<string, string> = {
  SUBSTANCE: 'Substance', DIGITAL: 'Digital', BEHAVIORAL: 'Behavioral', CUSTOM: 'Custom',
};

const CATEGORY_COLORS: Record<string, string> = {
  SUBSTANCE: Colors.Warning, DIGITAL: Colors.SteelBlue, BEHAVIORAL: Colors.Success, CUSTOM: Colors.DustyTaupe,
};

const MILESTONES = [7, 14, 21, 30, 60, 90, 180, 365];
const PREVIEW_LOG_COUNT = 4;

type LogFilter = 'ALL' | 'RESISTED' | 'RELAPSE';

const MILESTONE_MESSAGES: Record<number, string> = {
  7: 'One week strong! Keep going.',
  14: 'Two weeks of progress. You\u2019re building momentum.',
  21: 'Three weeks clean. A habit is forming.',
  30: 'One month! This is real commitment.',
  60: 'Two months of freedom.',
  90: '90 days. You\u2019ve proven your strength.',
  180: 'Half a year clean. Incredible.',
  365: 'One year. You did it.',
};

function getCalendarGrid(quitDate: string, relapseDates: string[], displayMonth: Date) {
  const now = new Date();
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;

  const quit = new Date(quitDate);
  const relapseSet = new Set(relapseDates);

  const cells: { day: number | null; status: 'clean' | 'relapse' | 'future' | 'pre' }[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ day: null, status: 'pre' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toISOString().slice(0, 10);
    if (dateObj > todayStart) {
      cells.push({ day: d, status: 'future' });
    } else if (dateObj < quit) {
      cells.push({ day: d, status: 'pre' });
    } else if (relapseSet.has(dateStr)) {
      cells.push({ day: d, status: 'relapse' });
    } else {
      cells.push({ day: d, status: 'clean' });
    }
  }
  return {
    cells,
    monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    todayDay: isCurrentMonth ? now.getDate() : null,
  };
}

function getBestStreak(events: UrgeEvent[], quitDate: string): number {
  const relapseDates = events
    .filter((e) => e.type === 'RELAPSE' && e.resetCounter)
    .map((e) => e.loggedAt.slice(0, 10))
    .sort();
  if (relapseDates.length === 0) return daysSinceQuit(quitDate);
  let best = 0;
  let start = new Date(quitDate);
  for (const rd of relapseDates) {
    const end = new Date(rd);
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > best) best = diff;
    start = end;
  }
  const finalDiff = daysSinceQuit(relapseDates[relapseDates.length - 1]);
  if (finalDiff > best) best = finalDiff;
  return best;
}

function getTotalCleanDays(events: UrgeEvent[], quitDate: string): number {
  const totalDays = daysSinceQuit(quitDate);
  const relapseDays = events.filter((e) => e.type === 'RELAPSE' && e.resetCounter).length;
  return Math.max(0, totalDays - relapseDays);
}

function formatEventDateLabel(isoDate: string): string {
  const eventDate = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const timeLabel = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (eventDate.toDateString() === today.toDateString()) {
    return `Today, ${timeLabel}`;
  }

  if (eventDate.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${timeLabel}`;
  }

  return eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function BadHabitDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [habit, setHabit] = useState<BadHabit | null>(null);
  const [urgeEvents, setUrgeEvents] = useState<UrgeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRelapse, setShowRelapse] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilter>('ALL');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const loadData = useCallback(async () => {
    if (!id) return;
    const [h, events] = await Promise.all([
      getBadHabitById(id as string),
      getUrgeEventsForHabit(id as string),
    ]);
    setHabit(h ?? null);
    setUrgeEvents(events);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const handleResisted = async () => {
    if (!id) return;
    await logUrgeEvent({
      badHabitId: id as string,
      type: 'RESISTED' as UrgeEventType,
      note: null,
      triggerTag: null,
      resetCounter: false,
    });
    await loadData();
  };

  if (loading || !habit) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => safeBack(router, '/(tabs)/track/bad-habits')} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ ...Typography.Body1, color: Colors.TextSecondary }}>Loading...</Text>
        </View>
      </View>
    );
  }

  const cleanDays = daysSinceQuit(habit.quitDate);
  const lastRelapse = urgeEvents
    .filter((e) => e.type === 'RELAPSE')
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))[0];

  const triggerCounts: Record<string, number> = {};
  urgeEvents.forEach((e) => {
    if (e.triggerTag) {
      e.triggerTag.split(', ').forEach((tag) => {
        triggerCounts[tag] = (triggerCounts[tag] || 0) + 1;
      });
    }
  });
  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);

  const sortedEvents = [...urgeEvents]
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))

  const filteredEvents = sortedEvents.filter((event) => {
    if (logFilter === 'ALL') return true;
    return event.type === logFilter;
  });

  const visibleEvents = showAllLogs
    ? filteredEvents
    : filteredEvents.slice(0, PREVIEW_LOG_COUNT);

  const hasMoreLogs = filteredEvents.length > PREVIEW_LOG_COUNT;

  const relapseDates = urgeEvents
    .filter((e) => e.type === 'RELAPSE' && e.resetCounter)
    .map((e) => e.loggedAt.slice(0, 10));

  const cal = getCalendarGrid(habit.quitDate, relapseDates, calendarMonth);
  const bestStreak = getBestStreak(urgeEvents, habit.quitDate);
  const totalClean = getTotalCleanDays(urgeEvents, habit.quitDate);

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

  const nearestMilestone = MILESTONES.filter((m) => m <= cleanDays).pop();
  const milestoneMsg = nearestMilestone ? MILESTONE_MESSAGES[nearestMilestone] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RelapseSheet
        visible={showRelapse}
        onClose={() => setShowRelapse(false)}
        badHabitId={habit.id}
        onLogged={loadData}
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)/track/bad-habits')}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>{habit.name}</Text>
          <View style={styles.headerBadges}>
            <Badge
              label={CATEGORY_LABELS[habit.category] || habit.category}
              color={CATEGORY_COLORS[habit.category] || Colors.SoftSky}
              textColor={Colors.TextPrimary}
            />
          </View>
        </View>
        <Pressable
          onPress={() => router.push(`/track/add-edit-bad-habit?id=${habit.id}` as any)}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="create-outline" size={22} color={Colors.SteelBlue} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={loadData} tintColor={Colors.SteelBlue} />
        }
      >
        {/* Clean Streak Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroInner}>
            <View style={styles.heroShieldWrap}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.Success} />
            </View>
            <Text style={styles.heroNumber}>{cleanDays}</Text>
            <Text style={styles.heroLabel}>DAYS CLEAN</Text>
            {lastRelapse && (
              <Text style={styles.heroSub}>
                Last relapse: {new Date(lastRelapse.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.Success }]}>{cleanDays}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.SteelBlue }]}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.Warning }]}>{totalClean}</Text>
            <Text style={styles.statLabel}>Total Clean</Text>
          </View>
        </View>

        {/* Milestone Card */}
        {milestoneMsg && (
          <LinearGradient
            colors={[Colors.Success, '#6DD5A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.milestoneCard}
          >
            <Ionicons name="trophy" size={24} color={Colors.Surface} />
            <View style={styles.milestoneContent}>
              <Text style={styles.milestoneTitle}>{nearestMilestone} days milestone!</Text>
              <Text style={styles.milestoneMessage}>{milestoneMsg}</Text>
            </View>
          </LinearGradient>
        )}

        {/* Calendar */}
        <Card style={styles.calendarCard}>
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

            <View style={styles.calendarHeaderLeft}>
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
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <View key={`day-${i}`} style={styles.calendarDayLabel}>
                <Text style={styles.calendarDayLabelText}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {cal.cells.map((cell, i) => {
              if (!cell.day) {
                return (
                  <View key={`empty-${i}`} style={styles.calendarCellWrap}>
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
                      cell.status === 'clean' && styles.calendarCellClean,
                      cell.status === 'relapse' && styles.calendarCellRelapse,
                      cell.status === 'future' && styles.calendarCellFuture,
                      cell.status === 'pre' && styles.calendarCellPre,
                      isToday && styles.calendarCellToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        cell.status === 'future' && styles.calendarCellTextFuture,
                        cell.status === 'pre' && styles.calendarCellTextPre,
                        isToday && styles.calendarCellTextToday,
                      ]}
                    >
                      {cell.day}
                    </Text>

                    {cell.status === 'clean' && <View style={styles.calendarStatusDotClean} />}
                    {cell.status === 'relapse' && <View style={styles.calendarStatusDotRelapse} />}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.Success }]} />
              <Text style={styles.legendText}>Clean</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.Danger }]} />
              <Text style={styles.legendText}>Relapse</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.SurfaceContainerLow }]} />
              <Text style={styles.legendText}>Upcoming</Text>
            </View>
          </View>
        </Card>

        {/* Quit Date Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.SteelBlue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Quit Date</Text>
              <Text style={styles.infoValue}>
                {new Date(habit.quitDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          {habit.notes && (
            <View style={[styles.infoRow, { marginTop: Spacing.md }]}>
              <Ionicons name="document-text-outline" size={18} color={Colors.TextSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{habit.notes}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Trigger Journal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash-outline" size={18} color={Colors.Warning} />
            <Text style={styles.sectionTitle}>Trigger Journal</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.triggerPrompt,
              { transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={() => setShowRelapse(true)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.TextSecondary} />
            <Text style={styles.triggerPromptText}>What triggered you today?</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.DustyTaupe} />
          </Pressable>
        </View>

        {/* Common Triggers */}
        {sortedTriggers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Common Triggers</Text>
            <View style={styles.triggerCloud}>
              {sortedTriggers.map(([tag, count]) => {
                const fontSize = 12 + Math.min(count * 2, 8);
                return (
                  <View key={tag} style={styles.triggerTag}>
                    <Text style={[styles.triggerTagText, { fontSize }]}>{tag}</Text>
                    <Text style={styles.triggerCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Urge Log */}
        {urgeEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.logHeaderRow}>
              <Text style={styles.sectionTitle}>Urge Log</Text>
              <View style={styles.logCountBadge}>
                <Text style={styles.logCountText}>{filteredEvents.length}</Text>
              </View>
            </View>

            <View style={styles.logFiltersRow}>
              {([
                { key: 'ALL', label: 'All' },
                { key: 'RESISTED', label: 'Resisted' },
                { key: 'RELAPSE', label: 'Relapsed' },
              ] as { key: LogFilter; label: string }[]).map((item) => {
                const isActive = logFilter === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setLogFilter(item.key);
                      setShowAllLogs(false);
                    }}
                    style={({ pressed }) => [
                      styles.logFilterChip,
                      isActive && styles.logFilterChipActive,
                      { transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <Text style={[styles.logFilterText, isActive && styles.logFilterTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredEvents.length === 0 ? (
              <View style={styles.filteredEmptyLog}>
                <Text style={styles.filteredEmptyLogText}>No logs for this filter.</Text>
              </View>
            ) : (
              visibleEvents.map((event) => {
                const isResisted = event.type === 'RESISTED';
                const dateLabel = formatEventDateLabel(event.loggedAt);
                const tags = event.triggerTag ? event.triggerTag.split(', ') : [];
                const visibleTags = tags.slice(0, 2);
                const hiddenTagCount = Math.max(0, tags.length - visibleTags.length);

                return (
                  <Card key={event.id} style={styles.logCard}>
                    <View style={styles.logRow}>
                      <View style={[styles.logDot, { backgroundColor: isResisted ? Colors.Success : Colors.Danger }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logType}>
                          {isResisted ? 'Resisted' : 'Relapsed'}
                        </Text>
                        {event.note && (
                          <Text style={styles.logNote} numberOfLines={1}>{event.note}</Text>
                        )}
                      </View>
                      <Text style={styles.logDate}>{dateLabel}</Text>
                    </View>
                    {visibleTags.length > 0 && (
                      <View style={styles.logTags}>
                        {visibleTags.map((tag, idx) => (
                          <View key={`${event.id}-${tag}-${idx}`} style={styles.logTagChip}>
                            <Text style={styles.logTagText}>{tag}</Text>
                          </View>
                        ))}
                        {hiddenTagCount > 0 && (
                          <Text style={styles.logMoreCount}>+{hiddenTagCount}</Text>
                        )}
                      </View>
                    )}
                  </Card>
                );
              })
            )}

            {hasMoreLogs && (
              <Pressable
                onPress={() => setShowAllLogs((prev) => !prev)}
                style={({ pressed }) => [
                  styles.logToggleBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.logToggleText}>
                  {showAllLogs ? 'Show less' : `Show all ${filteredEvents.length} logs`}
                </Text>
                <Ionicons
                  name={showAllLogs ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={Colors.SteelBlue}
                />
              </Pressable>
            )}
          </View>
        )}

        {urgeEvents.length === 0 && (
          <View style={styles.emptyLog}>
            <Ionicons name="checkmark-circle-outline" size={40} color={Colors.DustyTaupe} />
            <Text style={styles.emptyLogTitle}>No urge events logged</Text>
            <Text style={styles.emptyLogSub}>Tap &quot;I Resisted&quot; to start tracking your progress</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleResisted}
              style={({ pressed }) => [
                styles.resistBtn,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.Success, '#6DD5A0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resistBtnGradient}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.Surface} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.resistBtnText}>I Resisted</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => setShowRelapse(true)}
              style={({ pressed }) => [
                styles.relapseBtn,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Text style={styles.relapseBtnText}>Log Relapse</Text>
            </Pressable>
          </View>
        </View>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.WarmSand + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 17,
    lineHeight: 22,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.TextPrimary,
    borderRadius: Shapes.HeroCard,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.HeroCard,
  },
  heroInner: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroShieldWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.Success + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroNumber: {
    ...Typography.Stat,
    fontSize: 64,
    lineHeight: 72,
    color: Colors.Surface,
  },
  heroLabel: {
    ...Typography.Caption,
    color: Colors.SoftSky,
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  heroSub: {
    ...Typography.Caption,
    color: Colors.Surface + 'AA',
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.Card,
  },
  statValue: {
    ...Typography.Stat,
    fontSize: 28,
    lineHeight: 34,
  },
  statLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  milestoneCard: {
    borderRadius: Shapes.HeroCard,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    ...Typography.Headline2,
    color: Colors.Surface,
    fontSize: 16,
    lineHeight: 22,
  },
  milestoneMessage: {
    ...Typography.Body2,
    color: Colors.Surface + 'DD',
    marginTop: 2,
  },
  calendarCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Shapes.HeroCard,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calendarHeaderLeft: {
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
    color: Colors.TextPrimary,
    fontWeight: '700',
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
  calendarCellClean: {
    backgroundColor: Colors.Success + '16',
    borderColor: Colors.Success + '40',
  },
  calendarCellRelapse: {
    backgroundColor: Colors.Danger + '16',
    borderColor: Colors.Danger + '40',
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
  calendarCellTextFuture: {
    color: Colors.DustyTaupe,
  },
  calendarCellTextPre: {
    color: Colors.DustyTaupe,
  },
  calendarCellTextToday: {
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  calendarStatusDotClean: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.Success,
  },
  calendarStatusDotRelapse: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.Danger,
  },
  calendarLegend: {
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
  infoCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoLabel: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
  },
  infoValue: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
    lineHeight: 24,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  logCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.SoftSky + '45',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  logCountText: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: '700',
  },
  logFiltersRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  logFilterChip: {
    borderRadius: Shapes.Chip,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  logFilterChipActive: {
    borderColor: Colors.SteelBlue + '55',
    backgroundColor: Colors.SoftSky + '33',
  },
  logFilterText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '500',
  },
  logFilterTextActive: {
    color: Colors.SteelBlue,
    fontWeight: '700',
  },
  filteredEmptyLog: {
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  filteredEmptyLogText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  triggerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.Card,
  },
  triggerPromptText: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    flex: 1,
  },
  triggerCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  triggerTag: {
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Badge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  triggerTagText: {
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  triggerCount: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Badge,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  logCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  logType: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  logNote: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  logDate: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    flexShrink: 0,
  },
  logTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginLeft: Spacing.lg + Spacing.sm,
  },
  logTagChip: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  logTagText: {
    ...Typography.Micro,
    color: Colors.TextPrimary,
  },
  logMoreCount: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    alignSelf: 'center',
  },
  logToggleBtn: {
    marginTop: Spacing.xs,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  logToggleText: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  emptyLog: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyLogTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  emptyLogSub: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
  },
  actionSection: {
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  resistBtn: {
    flex: 2,
    borderRadius: Shapes.Button,
    overflow: 'hidden',
  },
  resistBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
  },
  resistBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.Surface,
    letterSpacing: 0.4,
  },
  relapseBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Shapes.Button,
    borderWidth: 1,
    borderColor: Colors.Danger + '40',
    height: 52,
  },
  relapseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.Danger,
  },
});
