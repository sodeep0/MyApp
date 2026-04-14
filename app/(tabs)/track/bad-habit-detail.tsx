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

function getCalendarGrid(quitDate: string, relapseDates: string[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = now.getDate();

  const quit = new Date(quitDate);
  const relapseSet = new Set(relapseDates);

  const cells: { day: number | null; status: 'clean' | 'relapse' | 'future' | 'pre' }[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ day: null, status: 'pre' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toISOString().slice(0, 10);
    if (d > today) {
      cells.push({ day: d, status: 'future' });
    } else if (dateObj < quit) {
      cells.push({ day: d, status: 'pre' });
    } else if (relapseSet.has(dateStr)) {
      cells.push({ day: d, status: 'relapse' });
    } else {
      cells.push({ day: d, status: 'clean' });
    }
  }
  return { cells, monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
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

export default function BadHabitDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [habit, setHabit] = useState<BadHabit | null>(null);
  const [urgeEvents, setUrgeEvents] = useState<UrgeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRelapse, setShowRelapse] = useState(false);

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
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
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

  const recentEvents = [...urgeEvents]
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, 10);

  const relapseDates = urgeEvents
    .filter((e) => e.type === 'RELAPSE' && e.resetCounter)
    .map((e) => e.loggedAt.slice(0, 10));

  const cal = getCalendarGrid(habit.quitDate, relapseDates);
  const bestStreak = getBestStreak(urgeEvents, habit.quitDate);
  const totalClean = getTotalCleanDays(urgeEvents, habit.quitDate);

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
          onPress={() => router.back()}
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
            <Ionicons name="calendar-outline" size={18} color={Colors.SteelBlue} />
            <Text style={styles.calendarTitle}>{cal.monthName}</Text>
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
              if (!cell.day) return <View key={`empty-${i}`} style={styles.calendarCell} />;
              const bgMap = {
                clean: Colors.Success,
                relapse: Colors.Danger,
                future: Colors.SurfaceContainerLow,
                pre: Colors.SurfaceContainerHigh,
              };
              return (
                <View
                  key={`cell-${cell.day}`}
                  style={[
                    styles.calendarCell,
                    { backgroundColor: bgMap[cell.status] },
                    cell.status === 'clean' && styles.calendarCellClean,
                    cell.status === 'relapse' && styles.calendarCellRelapse,
                  ]}
                >
                  <Text style={[
                    styles.calendarCellText,
                    cell.status === 'future' && styles.calendarCellTextFuture,
                    cell.status === 'pre' && styles.calendarCellTextPre,
                  ]}>
                    {cell.day}
                  </Text>
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
        {recentEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Urge Log</Text>
            {recentEvents.map((event) => {
              const isResisted = event.type === 'RESISTED';
              const dateLabel = new Date(event.loggedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
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
                  {event.triggerTag && (
                    <View style={styles.logTags}>
                      {event.triggerTag.split(', ').map((tag) => (
                        <View key={tag} style={styles.logTagChip}>
                          <Text style={styles.logTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {recentEvents.length === 0 && (
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
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  calendarTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  calendarDays: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  calendarDayLabel: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayLabelText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.SurfaceContainerLow,
  },
  calendarCellClean: {
    backgroundColor: Colors.Success + '30',
  },
  calendarCellRelapse: {
    backgroundColor: Colors.Danger + '30',
  },
  calendarCellText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
  },
  calendarCellTextFuture: {
    color: Colors.DustyTaupe,
  },
  calendarCellTextPre: {
    color: Colors.DustyTaupe,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
    padding: Spacing.md,
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
