import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadows, Shapes, Spacing, Typography } from '@/constants/theme';
import type { Goal } from '@/types/models';

function getGoalProgress(goal: Goal) {
  if (goal.goalType === 'QUANTITATIVE' && goal.targetValue && goal.targetValue > 0) {
    return Math.min(goal.currentValue / goal.targetValue, 1);
  }

  if (goal.goalType === 'MILESTONE' && goal.milestones.length > 0) {
    const done = goal.milestones.filter((m) => m.isCompleted).length;
    return Math.min(done / goal.milestones.length, 1);
  }

  return 0;
}

function getGoalEmoji(goal: Goal) {
  if (goal.category === 'FITNESS') return '🏃';
  if (goal.category === 'LEARNING') return '📚';
  if (goal.category === 'CAREER') return '💼';
  if (goal.category === 'FINANCE') return '💰';
  if (goal.category === 'RELATIONSHIP') return '❤️';
  return '🎯';
}

function getGoalAccent(goal: Goal) {
  if (goal.category === 'FITNESS') return Colors.Success;
  if (goal.category === 'LEARNING') return Colors.SteelBlue;
  if (goal.category === 'CAREER') return Colors.Warning;
  if (goal.category === 'FINANCE') return Colors.TextSecondary;
  if (goal.category === 'RELATIONSHIP') return Colors.Danger;
  return Colors.SoftSky;
}

type HomeGoalCardProps = {
  goal: Goal;
  onPress: (goalId: string) => void;
};

export const HomeGoalCard = React.memo(function HomeGoalCard({
  goal,
  onPress,
}: HomeGoalCardProps) {
  const progress = getGoalProgress(goal);
  const progressPct = Math.round(progress * 100);
  const accent = getGoalAccent(goal);

  return (
    <Pressable
      onPress={() => onPress(goal.id)}
      accessibilityRole="button"
      accessibilityLabel={`Goal ${goal.title || 'Untitled Goal'}`}
      style={({ pressed }) => [
        styles.goalCard,
        { transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.goalCardTop}>
        <Text style={styles.goalEmoji}>{getGoalEmoji(goal)}</Text>
        <View style={[styles.goalProgressPill, { backgroundColor: accent + '1F' }]}>
          <Text style={[styles.goalProgressPillText, { color: accent }]}>
            {progressPct}% complete
          </Text>
        </View>
      </View>

      <Text style={styles.goalTitle} numberOfLines={2}>
        {goal.title || 'Untitled Goal'}
      </Text>

      <Text style={styles.goalDate}>
        {goal.targetDate
          ? `Deadline: ${new Date(goal.targetDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}`
          : 'Open-ended goal'}
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
});

export { getGoalProgress };

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
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
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: Shapes.PillButton,
  },
});
