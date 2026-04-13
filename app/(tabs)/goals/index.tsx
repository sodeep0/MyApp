import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { GoalCard } from '@/components/GoalCard';
import {
  type Goal,
  GoalStatus,
} from '@/types/models';
import { getAllGoals } from '@/stores/goalStore';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

type FilterTab = GoalStatus.ACTIVE | GoalStatus.COMPLETED | 'ALL';
type ViewMode = 'card' | 'timeline';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: GoalStatus.ACTIVE, label: 'Active' },
  { key: GoalStatus.COMPLETED, label: 'Completed' },
  { key: 'ALL', label: 'All' },
];

export default function GoalListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>(GoalStatus.ACTIVE);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [goals, setGoals] = useState<Goal[]>([]);

  const loadData = useCallback(async () => {
    const data = await getAllGoals();
    setGoals(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
  const completedGoals = goals.filter((g) => g.status === GoalStatus.COMPLETED);

  const filteredGoals = goals.filter((goal) => {
    if (activeTab === 'ALL') return true;
    return goal.status === activeTab;
  });

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
      FITNESS: 'fitness-outline',
      LEARNING: 'book-outline',
      CAREER: 'briefcase-outline',
      FINANCE: 'card-outline',
      RELATIONSHIP: 'heart-outline',
      PERSONAL: 'person-outline',
    };
    return map[category] || 'flag-outline';
  };

  const getCategoryColor = (category: string): string => {
    const map: Record<string, string> = {
      FITNESS: Colors.Success,
      LEARNING: '#7B68EE',
      CAREER: Colors.SteelBlue,
      FINANCE: Colors.Warning,
      RELATIONSHIP: '#E91E63',
      PERSONAL: Colors.SoftSky,
    };
    return map[category] || Colors.SteelBlue;
  };

  const computeDaysLeft = (targetDate: string | null | undefined): number | null => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getProgress = (goal: Goal): number => {
    if (goal.goalType === 'QUANTITATIVE' && goal.targetValue) {
      return Math.min((goal.currentValue || 0) / goal.targetValue, 1);
    }
    if (goal.goalType === 'MILESTONE' && goal.milestones && goal.milestones.length > 0) {
      return goal.milestones.filter((m) => m.isCompleted).length / goal.milestones.length;
    }
    return goal.status === GoalStatus.COMPLETED ? 1 : 0;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>{getDateString()}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => setViewMode('card')}
              style={[styles.viewToggleBtn, viewMode === 'card' && styles.viewToggleBtnActive]}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={viewMode === 'card' ? Colors.SteelBlue : Colors.TextSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode('timeline')}
              style={[styles.viewToggleBtn, viewMode === 'timeline' && styles.viewToggleBtnActive]}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={viewMode === 'timeline' ? Colors.SteelBlue : Colors.TextSecondary}
              />
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/goals/add-edit' as any)}
            style={({ pressed }) => [
              styles.addButton,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Ionicons name="add" size={22} color={Colors.SteelBlue} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabContainer}>
          {FILTER_TABS.map((tab) => {
            const count = tab.key === GoalStatus.ACTIVE
              ? activeGoals.length
              : tab.key === GoalStatus.COMPLETED
                ? completedGoals.length
                : goals.length;
            const isActive = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                  <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    {' '}{count}
                  </Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {filteredGoals.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="flag-outline" size={40} color={Colors.DustyTaupe} />
            </View>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyDescription}>
              Start by setting your first goal and take the first step.
            </Text>
            <Pressable
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/goals/add-edit' as any)}
            >
              <Ionicons name="add" size={18} color={Colors.Surface} />
              <Text style={styles.emptyButtonText}>Create Goal</Text>
            </Pressable>
          </View>
        )}

        {viewMode === 'card' ? (
          <View style={styles.cardGrid}>
            {filteredGoals.map((goal) => (
              <View key={goal.id} style={styles.goalCardWrapper}>
                <GoalCard
                  goal={goal}
                  onPress={() => router.push(`/goals/detail?id=${goal.id}` as any)}
                />
                {goal.status === GoalStatus.COMPLETED && (
                  <View style={styles.achievedStamp} pointerEvents="none">
                    <Ionicons name="checkmark-circle" size={16} color={Colors.Surface} />
                    <Text style={styles.achievedText}>ACHIEVED</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.timelineList}>
            {filteredGoals.map((goal) => {
              const isCompleted = goal.status === GoalStatus.COMPLETED;
              const progress = getProgress(goal);
              const progressPercent = Math.round(progress * 100);
              const daysLeft = computeDaysLeft(goal.targetDate);
              const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && !isCompleted;
              const catColor = getCategoryColor(goal.category);

              return (
                <Pressable
                  key={goal.id}
                  onPress={() => router.push(`/goals/detail?id=${goal.id}` as any)}
                  style={({ pressed }) => [
                    styles.timelineItem,
                    { opacity: pressed ? 0.7 : 1 },
                    isCompleted && styles.timelineItemCompleted,
                  ]}
                >
                  <View style={[styles.timelineDot, { backgroundColor: catColor }]} />
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Text style={[styles.timelineTitle, isCompleted && styles.timelineTitleCompleted]} numberOfLines={1}>
                        {goal.title}
                      </Text>
                      <View style={[styles.timelineCategory, { backgroundColor: catColor + '18' }]}>
                        <Ionicons name={getCategoryIcon(goal.category)} size={12} color={catColor} />
                        <Text style={[styles.timelineCategoryText, { color: catColor }]}>
                          {goal.category.charAt(0) + goal.category.slice(1).toLowerCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timelineBarTrack}>
                      <View style={[styles.timelineBarFill, { width: `${progressPercent}%`, backgroundColor: isCompleted ? Colors.Success : Colors.SteelBlue }]} />
                    </View>
                    <View style={styles.timelineMeta}>
                      <Text style={styles.timelineProgress}>{progressPercent}%</Text>
                      {daysLeft !== null && daysLeft >= 0 && (
                        <View style={[styles.daysChip, isNearDeadline && styles.daysChipWarning]}>
                          <Ionicons name="time-outline" size={10} color={isNearDeadline ? Colors.Warning : Colors.TextSecondary} />
                          <Text style={[styles.daysChipText, isNearDeadline && { color: Colors.Warning }]}>
                            {daysLeft}d left
                          </Text>
                        </View>
                      )}
                      {isCompleted && (
                        <View style={styles.achievedBadgeMini}>
                          <Ionicons name="checkmark-circle" size={10} color={Colors.Success} />
                          <Text style={styles.achievedBadgeText}>ACHIEVED</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(tabs)/goals/add-edit' as any)}
      >
        <Ionicons name="add" size={26} color={Colors.Surface} />
      </Pressable>
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
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.WarmSand + '60',
    borderRadius: Shapes.Badge,
    padding: 2,
  },
  viewToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: Shapes.Badge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.Surface,
    ...Shadows.Card,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.WarmSand + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
    borderWidth: 1,
    borderColor: Colors.WarmSand,
  },
  tabActive: {
    backgroundColor: Colors.SoftSky,
    borderColor: Colors.SteelBlue,
  },
  tabText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  tabTextActive: {
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  tabCount: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  tabCountActive: {
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.WarmSand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Shapes.Button,
  },
  emptyButtonText: {
    ...Typography.Body1,
    color: Colors.Surface,
    fontWeight: '600',
  },
  cardGrid: {
    gap: Spacing.md,
  },
  goalCardWrapper: {
    position: 'relative',
  },
  achievedStamp: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.Success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
    zIndex: 10,
  },
  achievedText: {
    ...Typography.Micro,
    color: Colors.Surface,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timelineList: {
    gap: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  timelineItemCompleted: {
    opacity: 0.65,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  timelineLine: {
    position: 'absolute',
    left: Spacing.sm + 5,
    top: 24,
    bottom: -Spacing.sm,
    width: 2,
    backgroundColor: Colors.BorderSubtle,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    ...Shadows.Card,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timelineTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  timelineTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.TextSecondary,
  },
  timelineCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
  },
  timelineCategoryText: {
    ...Typography.Micro,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineBarTrack: {
    height: 8,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.PillButton,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  timelineBarFill: {
    height: '100%',
    borderRadius: Shapes.PillButton,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineProgress: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  daysChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.WarmSand,
  },
  daysChipWarning: {
    backgroundColor: Colors.Warning + '18',
  },
  daysChipText: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  achievedBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  achievedBadgeText: {
    ...Typography.Micro,
    color: Colors.Success,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.screenH,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.TextPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.FAB,
  },
});
