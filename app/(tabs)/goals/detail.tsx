import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, LayoutAnimation } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { safeBack } from '@/navigation/safeBack';
import { getGoalById, updateGoal, toggleMilestone } from '@/stores/goalStore';
import { type Goal, GoalStatus } from '@/types/models';

const MOCK_LINKED_HABITS = [
  { id: '1', name: 'Morning Run', icon: 'walk-outline' },
];

const QUICK_LOG_VALUES = ['0.5', '1', '1.5', '2'];

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [milestonesCollapsed, setMilestonesCollapsed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        if (id) {
          const g = await getGoalById(id as string);
          if (g) {
            setGoal(g);
            setIsCompleted(g.status === GoalStatus.COMPLETED);
          }
        }
      };
      load();
    }, [id])
  );

  const refreshGoal = async () => {
    if (id) {
      const g = await getGoalById(id as string);
      if (g) setGoal(g);
    }
  };

  const currentGoal = goal || {
    id: '1', userId: 'local', category: 'FITNESS', title: 'Run a 5K',
    description: 'Build up running endurance and complete a 5K without stopping.',
    goalType: 'QUANTITATIVE' as const, currentValue: 3.4, targetValue: 5, unit: 'km',
    targetDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    milestones: [
      { id: '1', title: 'Run 1km without stopping', isCompleted: true, completedAt: '2026-03-01' },
      { id: '2', title: 'Run 2km without stopping', isCompleted: true, completedAt: '2026-03-10' },
      { id: '3', title: 'Run 3km without stopping', isCompleted: false, completedAt: null },
      { id: '4', title: 'Run 5km without stopping', isCompleted: false, completedAt: null },
    ],
    status: GoalStatus.ACTIVE, linkedHabitIds: [], createdAt: new Date().toISOString(), completedAt: null,
  } as Goal;

  const milestones = currentGoal.milestones || [];
  const completedMilestones = milestones.filter((m) => m.isCompleted).length;
  const totalMilestones = milestones.length;

  const progress =
    currentGoal.goalType === 'QUANTITATIVE' && currentGoal.targetValue
      ? (currentGoal.currentValue || 0) / currentGoal.targetValue
      : totalMilestones > 0
        ? completedMilestones / totalMilestones
        : currentGoal.status === GoalStatus.COMPLETED ? 1 : 0;
  const progressPercent = Math.round(progress * 100);

  const daysLeft = currentGoal.targetDate
    ? Math.ceil((new Date(currentGoal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && !isCompleted;

  const catIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    FITNESS: 'fitness-outline',
    LEARNING: 'book-outline',
    CAREER: 'briefcase-outline',
    FINANCE: 'card-outline',
    RELATIONSHIP: 'heart-outline',
    PERSONAL: 'person-outline',
  };
  const catColors: Record<string, string> = {
    FITNESS: Colors.Success,
    LEARNING: '#7B68EE',
    CAREER: Colors.SteelBlue,
    FINANCE: Colors.Warning,
    RELATIONSHIP: '#E91E63',
    PERSONAL: Colors.SoftSky,
  };
  const catColor = catColors[currentGoal.category] || Colors.SteelBlue;
  const catIcon = catIcons[currentGoal.category] || 'flag-outline';
  const gradientColors: [string, string] = [Colors.SteelBlue, Colors.TextPrimary];

  const handleToggleMilestone = async (milestoneId: string) => {
    if (id) {
      await toggleMilestone(id as string, milestoneId);
      await refreshGoal();
    }
  };

  const handleMarkComplete = () => {
    setShowCompleteModal(true);
  };

  const confirmMarkComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const completedAt = new Date().toISOString();
      if (id) {
        await updateGoal(id as string, { status: GoalStatus.COMPLETED, completedAt });
      }

      setGoal((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: GoalStatus.COMPLETED,
          completedAt,
        };
      });
      setIsCompleted(true);
      setShowCompleteModal(false);
    } finally {
      setIsCompleting(false);
    }
  };

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMilestonesCollapsed(!milestonesCollapsed);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)/goals')}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Goal Detail</Text>
        <Pressable
          onPress={() => router.push(`/(tabs)/goals/add-edit?id=${id}` as any)}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="pencil" size={20} color={Colors.SteelBlue} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: !isCompleted ? 160 : 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoSection}>
          <View style={[styles.categoryChip, { backgroundColor: catColor + '18' }]}>
            <Ionicons name={catIcon} size={14} color={catColor} />
            <Text style={[styles.categoryText, { color: catColor }]}>
              {currentGoal.category.charAt(0) + currentGoal.category.slice(1).toLowerCase()}
            </Text>
          </View>
          <Text style={styles.goalTitle}>{currentGoal.title}</Text>
          {currentGoal.description ? (
            <Text style={styles.goalDescription}>{currentGoal.description}</Text>
          ) : null}
          {daysLeft !== null && (
            <View style={[styles.deadlineBadge, isNearDeadline && styles.deadlineBadgeWarning]}>
              <Ionicons name="time-outline" size={14} color={isNearDeadline ? Colors.Warning : Colors.TextSecondary} />
              <Text style={[styles.deadlineText, isNearDeadline && { color: Colors.Warning }]}>
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`
                  : daysLeft === 0 ? 'Due today'
                  : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
              </Text>
            </View>
          )}
          {isCompleted && (
            <View style={styles.achievedBanner}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.Surface} />
              <Text style={styles.achievedBannerText}>ACHIEVED</Text>
            </View>
          )}
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.sectionLabel}>PROGRESS</Text>
          <View style={styles.progressNumbers}>
            {currentGoal.goalType === 'QUANTITATIVE' && currentGoal.targetValue ? (
              <Text style={styles.progressValue}>
                {currentGoal.goalType === 'QUANTITATIVE'
                  ? `${currentGoal.currentValue || 0}`
                  : `${completedMilestones}`}
                <Text style={styles.progressUnit}>
                  {currentGoal.goalType === 'QUANTITATIVE'
                    ? ` / ${currentGoal.targetValue} ${currentGoal.unit || ''}`
                    : ` of ${totalMilestones} done`}
                </Text>
              </Text>
            ) : (
              <Text style={styles.progressValue}>
                {completedMilestones}
                <Text style={styles.progressUnit}> of {totalMilestones} done</Text>
              </Text>
            )}
            <View style={styles.percentCircle}>
              <Text style={styles.percentValue}>{progressPercent}%</Text>
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>

          {currentGoal.goalType === 'QUANTITATIVE' && (
            <>
              <Text style={styles.quickLogLabel}>Quick log today&apos;s {currentGoal.unit || 'units'}:</Text>
              <View style={styles.quickLogRow}>
                {QUICK_LOG_VALUES.map((val) => (
                  <Pressable
                    key={val}
                    style={({ pressed }) => [
                      styles.quickLogChip,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                    onPress={() => {}}
                  >
                    <Text style={styles.quickLogText}>+{val} {currentGoal.unit || 'km'}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>

        {MOCK_LINKED_HABITS.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="link" size={16} color={Colors.TextSecondary} />
              <Text style={styles.sectionTitle}>LINKED HABITS</Text>
            </View>
            {MOCK_LINKED_HABITS.map((habit) => (
              <View key={habit.id} style={styles.habitItem}>
                <View style={styles.habitItemLeft}>
                  <View style={styles.habitIconBox}>
                    <Ionicons name={habit.icon as any} size={16} color={Colors.SteelBlue} />
                  </View>
                  <Text style={styles.habitName}>{habit.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.DustyTaupe} />
              </View>
            ))}
          </View>
        )}

        {milestones.length > 0 && (
          <View style={styles.section}>
            <Pressable onPress={toggleCollapse} style={styles.sectionHeader}>
              <Ionicons name="list" size={16} color={Colors.TextSecondary} />
              <Text style={styles.sectionTitle}>
                MILESTONES ({completedMilestones}/{totalMilestones})
              </Text>
              <Ionicons
                name={milestonesCollapsed ? 'chevron-down' : 'chevron-up'}
                size={16}
                color={Colors.TextSecondary}
              />
            </Pressable>
            {!milestonesCollapsed && milestones.map((milestone) => (
              <Pressable
                key={milestone.id}
                onPress={() => handleToggleMilestone(milestone.id)}
                style={styles.milestoneRow}
              >
                <View
                  style={[
                    styles.milestoneCheckbox,
                    milestone.isCompleted && {
                      backgroundColor: Colors.Success,
                      borderColor: Colors.Success,
                    },
                  ]}
                >
                  {milestone.isCompleted && (
                    <Ionicons name="checkmark" size={14} color={Colors.Surface} />
                  )}
                </View>
                <Text
                  style={[
                    styles.milestoneTitle,
                    milestone.isCompleted && styles.milestoneTitleCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {milestone.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.md }} />
      </ScrollView>

      {!isCompleted && (
        <View style={[styles.ctaContainer, { bottom: insets.bottom + 70 }]}> 
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              { transform: [{ scale: pressed ? 0.985 : 1 }] },
            ]}
            onPress={handleMarkComplete}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Ionicons name="checkmark-done-circle" size={18} color={Colors.Surface} />
              <Text style={styles.ctaText}>Mark as Completed</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isCompleting) {
            setShowCompleteModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-done-circle" size={24} color={Colors.SteelBlue} />
            </View>
            <Text style={styles.modalTitle}>Mark this goal as completed?</Text>
            <Text style={styles.modalMessage}>
              This will move the goal to completed and lock in your progress.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowCompleteModal(false)}
                disabled={isCompleting}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  isCompleting && styles.modalBtnDisabled,
                  { transform: [{ scale: pressed && !isCompleting ? 0.98 : 1 }] },
                ]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmMarkComplete}
                disabled={isCompleting}
                style={({ pressed }) => [
                  styles.modalConfirmBtn,
                  isCompleting && styles.modalBtnDisabled,
                  { transform: [{ scale: pressed && !isCompleting ? 0.98 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>
                    {isCompleting ? 'Saving...' : 'Mark Completed'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
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
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.WarmSand + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  infoSection: {
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.Caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  goalTitle: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    marginBottom: Spacing.sm,
  },
  goalDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.WarmSand,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Shapes.Badge,
    alignSelf: 'flex-start',
  },
  deadlineBadgeWarning: {
    backgroundColor: Colors.Warning + '18',
  },
  deadlineText: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  achievedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.Success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Button,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  achievedBannerText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  progressCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.Card,
  },
  sectionLabel: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
  },
  progressNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  progressValue: {
    ...Typography.Stat,
    color: Colors.TextPrimary,
  },
  progressUnit: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    color: Colors.TextSecondary,
  },
  percentCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.SteelBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentValue: {
    ...Typography.Body1,
    fontWeight: '700',
    color: Colors.SteelBlue,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.WarmSand,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickLogLabel: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.sm,
  },
  quickLogRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  quickLogChip: {
    backgroundColor: Colors.SteelBlue + '15',
    borderColor: Colors.SteelBlue + '50',
    borderWidth: 1,
    borderRadius: Shapes.Badge,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  quickLogText: {
    ...Typography.Body2,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    flex: 1,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    borderRadius: Shapes.Card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.Card,
  },
  habitItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  habitIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.SteelBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle + '60',
  },
  milestoneCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.DustyTaupe,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  milestoneTitle: {
    flex: 1,
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.TextSecondary,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
  },
  ctaButton: {
    borderRadius: Shapes.Button,
    overflow: 'hidden',
    ...Shadows.Card,
  },
  ctaGradient: {
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  ctaText: {
    ...Typography.Body1,
    fontWeight: '700',
    color: Colors.Surface,
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.OverlayLight,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
  },
  modalCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.lg,
    ...Shadows.Modal,
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.SteelBlue + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  modalMessage: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Shapes.Button,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WarmSand + '45',
  },
  modalCancelText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: Shapes.Button,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalConfirmText: {
    ...Typography.Body2,
    color: Colors.Surface,
    fontWeight: '700',
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },
});
