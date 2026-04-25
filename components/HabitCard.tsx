import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '../constants/theme';
import type { Habit } from '../types/models';

interface HabitCardProps {
  habit: Partial<Habit>;
  completed?: boolean;
  streak?: number;
  isAtRisk?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
  accentColor?: string;
  showStats?: boolean;
  stats?: { label: string; value: string }[];
}

export function HabitCard({
  habit,
  completed = false,
  streak = 0,
  isAtRisk = false,
  onPress,
  onToggle,
  accentColor,
  showStats = false,
  stats = [],
}: HabitCardProps) {
  const habitColor = habit.colorHex || Colors.SteelBlue;
  const borderAccent = accentColor || (completed ? Colors.Success : Colors.SteelBlue);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { borderLeftColor: borderAccent },
        isAtRisk && styles.containerAtRisk,
        completed && styles.containerCompleted,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: habitColor + '18' }]}>
          <Ionicons name="ellipse" size={16} color={habitColor} />
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, completed && styles.nameCompleted]} numberOfLines={1}>
            {habit.name || 'Untitled Habit'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.frequency}>DAILY</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={12} color={Colors.Surface} />
                <Text style={styles.streakText}>{streak} day streak</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={({ pressed }) => [
            styles.checkBtn,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <Ionicons
            name={completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={26}
            color={completed ? Colors.Success : Colors.DustyTaupe}
          />
        </Pressable>
      </View>

      {isAtRisk && (
        <View style={styles.atRiskBadge}>
          <Ionicons name="warning" size={12} color={Colors.Danger} />
          <Text style={styles.atRiskText}>STREAK AT RISK</Text>
        </View>
      )}

      {showStats && stats.length > 0 && (
        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export function AddHabitRow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.addContainer, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <Ionicons name="add-circle-outline" size={24} color={Colors.DustyTaupe} />
      <Text style={styles.addText}>Add New Habit</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
    borderLeftColor: Colors.SteelBlue,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.Card,
  },
  containerAtRisk: {
    borderColor: Colors.Danger + '20',
    borderLeftColor: Colors.Danger,
    borderWidth: 2,
    borderLeftWidth: 4,
  },
  containerCompleted: {
    borderLeftColor: Colors.Success,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  name: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.TextSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  frequency: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.Success,
    borderRadius: Shapes.Badge,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  streakText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontVariant: ['tabular-nums'],
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atRiskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.Danger + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Shapes.Badge,
    marginTop: Spacing.sm,
  },
  atRiskText: {
    ...Typography.Caption,
    color: Colors.Danger,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.DustyTaupe + '60',
    borderStyle: 'dashed',
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  addText: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
});

export default HabitCard;
