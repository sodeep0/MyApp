import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  InteractionManager,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Spacing, Typography, Shapes } from '@/constants/theme';
import { canEditActivityLog } from '@/constants/featureLimits';
import { safeBack } from '@/navigation/safeBack';
import { Card } from '@/components/Card';
import { getAllActivities, getWeeklySummary, getFrequentActivityNames } from '@/stores/activityStore';
import type { ActivityLog } from '@/types/models';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const CATEGORY_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  EXERCISE: { icon: 'fitness-outline', color: Colors.Success },
  WORK: { icon: 'briefcase-outline', color: Colors.SteelBlue },
  LEARNING: { icon: 'book-outline', color: Colors.Warning },
  SOCIAL: { icon: 'people-outline', color: Colors.SoftSky },
  REST: { icon: 'moon-outline', color: Colors.DustyTaupe },
  CHORES: { icon: 'home-outline', color: Colors.TextSecondary },
  CREATIVE: { icon: 'color-palette-outline', color: Colors.SoftSky },
  CUSTOM: { icon: 'star-outline', color: Colors.DustyTaupe },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ActivityLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [quickLogs, setQuickLogs] = useState<string[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<{ totalMinutes: number; byCategory: Record<string, number>; byDay?: Record<string, number> }>({ totalMinutes: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [activityData, summary, frequentNames] = await Promise.all([
      getAllActivities(),
      getWeeklySummary(),
      getFrequentActivityNames(3),
    ]);
    setActivities(activityData);
    setWeeklySummary(summary);
    setQuickLogs(frequentNames);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        void loadData();
      });

      return () => {
        task.cancel();
      };
    }, [loadData]),
  );

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const maxDayMinutes = weeklySummary.byDay
    ? Math.max(...Object.values(weeklySummary.byDay), 1)
    : 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/track')} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Activity Log</Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={{ ...Typography.Body1, color: Colors.TextSecondary, textAlign: 'center', paddingVertical: Spacing.xxl }}>Loading...</Text>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="bar-chart" size={20} color={Colors.SteelBlue} />
                <Text style={styles.summaryTitle}>Weekly Summary</Text>
              </View>
              <Text style={styles.summaryValue}>{formatDuration(weeklySummary.totalMinutes)}</Text>
              <Text style={styles.summarySub}>total logged this week</Text>

              {weeklySummary.byDay && (
                <View style={styles.barChart}>
                  {DAY_LABELS.map((day, i) => {
                    const key = Object.keys(weeklySummary.byDay!)[i] || `${i}`;
                    const val = weeklySummary.byDay![key] || 0;
                    const barHeight = val > 0 ? Math.max(4, (val / maxDayMinutes) * 100) : 4;
                    return (
                      <View key={day} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View style={[styles.barFill, { height: barHeight }]} />
                        </View>
                        <Text style={styles.barLabel}>{day}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {Object.keys(weeklySummary.byCategory).length > 0 && (
                <>
                  <View style={styles.breakdownRow}>
                    {(() => {
                      const sorted = Object.entries(weeklySummary.byCategory).sort((a, b) => b[1] - a[1]);
                      return sorted.map(([cat, mins]) => (
                        <View key={cat} style={[styles.breakdownSegment, { flex: Math.max(1, Math.round(mins / 10)), backgroundColor: CATEGORY_CONFIG[cat]?.color || Colors.DustyTaupe }]} />
                      ));
                    })()}
                  </View>
                  <View style={styles.breakdownLegend}>
                    {Object.entries(weeklySummary.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, mins]) => (
                        <View key={cat} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: CATEGORY_CONFIG[cat]?.color || Colors.DustyTaupe }]} />
                          <Text style={styles.legendText}>{cat} ({formatDuration(mins)})</Text>
                        </View>
                      ))}
                  </View>
                </>
              )}
            </Card>

            {quickLogs.length > 0 && (
              <View style={styles.quickLogSection}>
                <Text style={styles.sectionLabel}>QUICK LOG</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickLogRow}>
                  {quickLogs.map((log) => (
                    <Pressable
                      key={log}
                      style={({ pressed }) => [styles.quickLogChip, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                      onPress={() => router.push(`/track/log-activity?name=${encodeURIComponent(log)}` as any)}
                    >
                      <Ionicons name="flash" size={14} color={Colors.SteelBlue} />
                      <Text style={styles.quickLogLabel}>{log}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={styles.sectionLabel}>RECENT</Text>
            {activities.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="bar-chart-outline" size={44} color={Colors.DustyTaupe} />
                </View>
                <Text style={styles.emptyTitle}>No activities logged</Text>
                <Text style={styles.emptySub}>Start logging your daily activities</Text>
              </View>
            )}
            {activities.slice(0, 15).map((activity) => {
              const isEditable = canEditActivityLog(activity.loggedAt);
              const dateLabel = (() => {
                const today = new Date();
                const activityDate = new Date(activity.date);
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                if (activityDate.toDateString() === today.toDateString()) return 'Today';
                if (activityDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
                return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })();

              const catConfig = CATEGORY_CONFIG[activity.category] || CATEGORY_CONFIG.CUSTOM;

              return (
                <Pressable
                  key={activity.id}
                  style={({ pressed }) => [styles.logCard, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => router.push(`/track/log-activity?id=${activity.id}` as any)}
                >
                  <View style={styles.logRow}>
                    <View style={[styles.logIconCircle, { backgroundColor: `${catConfig.color}18` }]}>
                      <Ionicons name={catConfig.icon} size={20} color={catConfig.color} />
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={styles.logName} numberOfLines={1}>{activity.name}</Text>
                      <Text style={styles.logMeta}>
                        {dateLabel} - {activity.durationMinutes} min{isEditable ? '' : ' - Edit window closed'}
                      </Text>
                    </View>
                    <Ionicons
                      name={isEditable ? 'create-outline' : 'lock-closed-outline'}
                      size={18}
                      color={isEditable ? Colors.DustyTaupe : Colors.Warning}
                    />
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            right: Spacing.screenH + 22,
            bottom: insets.bottom + 70,
          },
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
        onPress={() => router.push('/track/log-activity' as any)}
      >
        <Ionicons name="add" size={28} color={Colors.Surface} />
      </Pressable>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  summaryCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  summaryTitle: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  summaryValue: {
    ...Typography.Stat,
    color: Colors.TextPrimary,
  },
  summarySub: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: Spacing.md,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
    backgroundColor: Colors.SurfaceContainerLow,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: Colors.SteelBlue,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    marginTop: Spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  breakdownSegment: {
    height: '100%',
  },
  breakdownLegend: {
    gap: Spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  quickLogSection: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...CommonStyles.sectionLabel,
    fontWeight: '700',
  },
  quickLogRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickLogChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.Surface,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  quickLogLabel: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  logCard: {
    ...CommonStyles.surfaceCard,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  logInfo: {
    flex: 1,
    gap: 2,
  },
  logName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  logMeta: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  emptyState: {
    ...CommonStyles.emptyStateCentered,
  },
  emptyIconWrap: {
    ...CommonStyles.emptyIconCircleMd,
    backgroundColor: Colors.SurfaceContainerHigh,
  },
  emptyTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  emptySub: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  fab: {
    ...CommonStyles.fabBase,
    backgroundColor: Colors.SteelBlue,
  },
});
