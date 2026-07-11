import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadows, Shapes, Spacing, Typography } from '@/constants/theme';
import { daysSinceQuit } from '@/stores/badHabitStore';
import {
  BadHabitCategory,
  BadHabitSeverity,
  type BadHabit,
} from '@/types/models';

function getBadHabitCategoryLabel(category: BadHabitCategory) {
  if (category === BadHabitCategory.SUBSTANCE) return 'Substance';
  if (category === BadHabitCategory.DIGITAL) return 'Digital';
  if (category === BadHabitCategory.BEHAVIORAL) return 'Behavioral';
  return 'Custom';
}

function getBadHabitSeverityLabel(severity: BadHabitSeverity) {
  if (severity === BadHabitSeverity.MILD) return 'Mild';
  if (severity === BadHabitSeverity.MODERATE) return 'Moderate';
  return 'Severe';
}

function getBadHabitAccent(category: BadHabitCategory) {
  if (category === BadHabitCategory.SUBSTANCE) return Colors.Warning;
  if (category === BadHabitCategory.DIGITAL) return Colors.SteelBlue;
  if (category === BadHabitCategory.BEHAVIORAL) return Colors.Success;
  return Colors.DustyTaupe;
}

type HomeBadHabitCardProps = {
  badHabit: BadHabit;
  relapsed: boolean;
  onPress: (badHabitId: string) => void;
};

export const HomeBadHabitCard = React.memo(function HomeBadHabitCard({
  badHabit,
  relapsed,
  onPress,
}: HomeBadHabitCardProps) {
  const daysClean = daysSinceQuit(badHabit.quitDate);
  const progressPct = Math.round(Math.max(0, Math.min(daysClean / 7, 1)) * 100);
  const accent = getBadHabitAccent(badHabit.category);

  return (
    <Pressable
      onPress={() => onPress(badHabit.id)}
      accessibilityRole="button"
      accessibilityLabel={`Bad habit ${badHabit.name || 'Untitled'}`}
      style={({ pressed }) => [
        styles.badHabitCard,
        { transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={styles.badHabitCardTop}>
        <View style={[styles.badHabitIconBox, { backgroundColor: accent + '14' }]}>
          <Ionicons name="warning-outline" size={20} color={accent} />
        </View>
        <View
          style={[
            styles.badHabitMetaPill,
            {
              backgroundColor: relapsed
                ? Colors.Danger + '16'
                : Colors.Success + '16',
            },
          ]}
        >
          <Text
            style={[
              styles.badHabitMetaPillText,
              { color: relapsed ? Colors.Danger : Colors.Success },
            ]}
          >
            {relapsed ? 'Relapse logged' : `${daysClean} clean days`}
          </Text>
        </View>
      </View>

      <Text style={styles.badHabitTitle} numberOfLines={2}>
        {badHabit.name || 'Untitled habit'}
      </Text>

      <Text style={styles.badHabitCaption}>
        {getBadHabitCategoryLabel(badHabit.category)} ·{' '}
        {getBadHabitSeverityLabel(badHabit.severity)}
      </Text>

      <Text style={styles.badHabitDate}>
        Since{' '}
        {new Date(badHabit.quitDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </Text>

      <View style={styles.badHabitBarTrack}>
        <View
          style={[
            styles.badHabitBarFill,
            {
              width: `${Math.max(progressPct, 4)}%`,
              backgroundColor: relapsed ? Colors.Danger : accent,
            },
          ]}
        />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  badHabitCard: {
    width: 280,
    borderRadius: 30,
    padding: Spacing.md,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    marginRight: Spacing.sm,
    ...Shadows.Card,
  },
  badHabitCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badHabitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badHabitMetaPill: {
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  badHabitMetaPillText: {
    ...Typography.Micro,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
  },
  badHabitTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: 2,
  },
  badHabitCaption: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: 2,
  },
  badHabitDate: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.md,
  },
  badHabitBarTrack: {
    height: 8,
    borderRadius: Shapes.PillButton,
    backgroundColor: Colors.SurfaceContainerLow,
    overflow: 'hidden',
  },
  badHabitBarFill: {
    height: '100%',
    borderRadius: Shapes.PillButton,
  },
});
