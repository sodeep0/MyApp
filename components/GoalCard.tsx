import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Colors,
  Spacing,
  Typography,
  Shapes,
  Shadows,
} from '../constants/theme';
import {
  type Goal,
  GoalCategory,
  GoalType,
  GoalStatus,
  type Milestone,
} from '../types/models';

type CategoryIconMap = Record<GoalCategory, keyof typeof Ionicons.glyphMap>;

const CATEGORY_ICONS: CategoryIconMap = {
  FITNESS: 'fitness-outline',
  LEARNING: 'book-outline',
  CAREER: 'briefcase-outline',
  FINANCE: 'card-outline',
  RELATIONSHIP: 'heart-outline',
  PERSONAL: 'person-outline',
};

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  FITNESS: Colors.Success,
  LEARNING: Colors.SoftSky,
  CAREER: Colors.SteelBlue,
  FINANCE: Colors.Warning,
  RELATIONSHIP: Colors.Danger,
  PERSONAL: Colors.SteelBlue,
};

const CHECKBOX_SIZE = 20;

interface GoalCardProps {
  goal: Partial<Goal>;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function GoalCardComponent({ goal, onPress, style }: GoalCardProps) {
  const category = goal.category || GoalCategory.PERSONAL;
  const categoryColor = CATEGORY_COLORS[category];
  const categoryLabel = category.charAt(0) + category.slice(1).toLowerCase();
  const icon = CATEGORY_ICONS[category] || 'flag-outline';

  const progress = calculateProgress(goal);
  const progressPercent = Math.round(progress * 100);
  const isCompleted = goal.status === GoalStatus.COMPLETED;
  const isQuantitative = goal.goalType === GoalType.QUANTITATIVE && !!goal.targetValue;

  const daysLeft = computeDaysLeft(goal.targetDate);
  const isNearDeadline = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && !isCompleted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        styles.container,
        isCompleted && styles.containerCompleted,
        style,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: categoryColor + '18' }]}>
        <Ionicons name={icon} size={20} color={categoryColor} />
      </View>

      {goal.goalType === GoalType.MILESTONE && (
        <View style={styles.percentBadge}>
          <Text style={[styles.percentText, { color: categoryColor }]}>
            {progressPercent}%
          </Text>
        </View>
      )}

      <View style={styles.titleRow}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]} numberOfLines={2}>
          {goal.title || 'Untitled Goal'}
        </Text>
        {isQuantitative && (
          <Text style={styles.progressNumbersInline} numberOfLines={1}>
            {formatNumber(goal.currentValue || 0)}
            <Text style={styles.progressUnitInline}>
              {` / ${formatNumber(goal.targetValue || 0)} ${goal.unit || ''}`}
            </Text>
          </Text>
        )}
      </View>

      <View style={[styles.categoryChip, isCompleted && styles.categoryChipCompleted]}>
        <Text
          style={[
            styles.categoryLabel,
            { color: categoryColor },
            isCompleted && styles.categoryLabelCompleted,
          ]}
        >
          {categoryLabel}
        </Text>
      </View>

      {isQuantitative && (
        <View style={styles.progressSection}>
          <Text style={styles.progressPercentLabel}>
            {progressPercent}% Progress
          </Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
            {!isCompleted && progressPercent === 0 && (
              <View style={styles.progressBarMinimum} />
            )}
          </View>
        </View>
      )}

      {goal.goalType === GoalType.MILESTONE && goal.milestones && goal.milestones.length > 0 && (
        <View style={styles.milestoneList}>
          {goal.milestones.slice(0, 4).map((m: Milestone, i: number) => (
            <View key={m.id || String(i)} style={styles.milestoneRow}>
              <View
                style={[
                  styles.checkbox,
                  m.isCompleted && {
                    backgroundColor: Colors.Success,
                    borderColor: Colors.Success,
                  },
                ]}
              >
                {m.isCompleted && (
                  <Ionicons name="checkmark" size={12} color={Colors.Surface} />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.milestoneText,
                  m.isCompleted && styles.milestoneTextCompleted,
                  isCompleted && styles.milestoneRowCompleted,
                ]}
              >
                {m.title}
              </Text>
            </View>
          ))}
          {goal.milestones.length > 4 && (
            <Text style={styles.milestoneMore}>
              +{goal.milestones.length - 4} more
            </Text>
          )}
        </View>
      )}

      <View style={styles.footerRow}>
        {!goal.targetDate && !isCompleted && (
          <View style={styles.openEndedBadge}>
            <Text style={styles.openEndedText}>OPEN-ENDED</Text>
          </View>
        )}

        {goal.targetDate && (
          <View
            style={[
              styles.deadlineBadge,
              isNearDeadline ? styles.deadlineBadgeWarning : styles.deadlineBadgeDefault,
            ]}
          >
            <Ionicons
              name="time-outline"
              size={12}
              color={isNearDeadline ? Colors.Warning : Colors.TextSecondary}
            />
            <Text
              style={[
                styles.deadlineText,
                isNearDeadline ? { color: Colors.Warning } : undefined,
              ]}
            >
              {isCompleted
                ? 'Completed'
                : daysLeft !== null && daysLeft >= 0
                  ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                  : daysLeft !== null && daysLeft < 0
                    ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`
                    : 'Open-ended'}
            </Text>
          </View>
        )}

        {isCompleted && (
          <View style={[styles.completedBadge]}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.Success} />
            <Text style={styles.completedBadgeText}>COMPLETED</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export const GoalCard = React.memo(GoalCardComponent);

function calculateProgress(goal: Partial<Goal>): number {
  if (goal.goalType === GoalType.QUANTITATIVE && goal.targetValue) {
    return Math.min((goal.currentValue || 0) / goal.targetValue, 1);
  }
  if (goal.goalType === GoalType.MILESTONE && goal.milestones && goal.milestones.length > 0) {
    return goal.milestones.filter((m: Milestone) => m.isCompleted).length / goal.milestones.length;
  }
  return 0;
}

function computeDaysLeft(targetDate: string | null | undefined): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatNumber(val: number): string {
  return val % 1 === 0 ? String(val) : val.toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    padding: Spacing.sm + 4,
    marginBottom: Spacing.sm,
    position: 'relative',
    ...Shadows.Card,
  },
  containerCompleted: {
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: Colors.Success,
    backgroundColor: Colors.Surface,
  },
  iconBox: {
    position: 'absolute',
    top: Spacing.sm + 4,
    left: Spacing.sm + 4,
    width: 32,
    height: 32,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  title: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginTop: 0,
    marginBottom: 0,
    flex: 1,
  },
  titleRow: {
    marginTop: 34,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.TextSecondary,
  },
  categoryChip: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  categoryChipCompleted: {
    opacity: 0.7,
  },
  categoryLabel: {
    ...Typography.Caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  categoryLabelCompleted: {
    color: Colors.TextSecondary,
  },
  progressSection: {
    marginTop: Spacing.xs,
  },
  progressNumbersInline: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '700',
    marginTop: 2,
    flexShrink: 0,
    fontVariant: ['tabular-nums'],
  },
  progressUnitInline: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    fontWeight: '500',
  },
  progressPercentLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginBottom: Spacing.xs,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.PillButton,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.SteelBlue,
    borderRadius: Shapes.PillButton,
  },
  progressBarMinimum: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '2%',
    backgroundColor: Colors.SteelBlue,
    opacity: 0.4,
    borderRadius: Shapes.PillButton,
  },
  milestoneList: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  milestoneRowCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: Shapes.Chip,
    borderWidth: 2,
    borderColor: Colors.DustyTaupe,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    flex: 1,
  },
  milestoneTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.TextSecondary,
  },
  milestoneMore: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    marginTop: Spacing.xs,
    marginLeft: CHECKBOX_SIZE + Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  openEndedBadge: {
    borderWidth: 1,
    borderColor: Colors.DustyTaupe,
    borderRadius: Shapes.Badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  openEndedText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
  },
  deadlineBadgeWarning: {
    backgroundColor: Colors.Warning + '18',
  },
  deadlineBadgeDefault: {
    backgroundColor: Colors.WarmSand,
  },
  deadlineText: {
    ...Typography.Micro,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.Success + '18',
  },
  completedBadgeText: {
    ...Typography.Micro,
    color: Colors.Success,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default GoalCard;
