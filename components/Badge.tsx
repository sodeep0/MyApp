import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes } from '../constants/theme';

type BadgeVariant = 'default' | 'selected' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  pill?: boolean;
  color?: string;
  bgColor?: string;
  textColor?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.WarmSand, text: Colors.TextPrimary },
  selected: { bg: Colors.SoftSky, text: Colors.TextPrimary },
  success: { bg: Colors.Success, text: Colors.Surface },
  warning: { bg: Colors.Warning, text: Colors.Surface },
  danger: { bg: Colors.Danger, text: Colors.Surface },
};

export function Badge({
  label,
  variant,
  pill = true,
  color,
  bgColor,
  textColor,
}: BadgeProps) {
  const effectiveVariant = variant || 'default';
  const { bg: variantBg, text: variantText } = VARIANT_STYLES[effectiveVariant];
  const bg = bgColor || color || variantBg;
  const text = textColor || (color ? Colors.Surface : variantText);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderRadius: pill ? Shapes.Badge : Shapes.Chip },
      ]}
    >
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
}

interface StreakBadgeProps {
  count: number;
}

export function StreakBadge({ count }: StreakBadgeProps) {
  return (
    <View style={styles.streakBadge}>
      <Ionicons name="flame" size={12} color={Colors.Surface} />
      <Text style={styles.streakText}>{count}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: 'success' | 'warning' | 'danger' }) {
  const config = {
    success: { bg: Colors.Success, text: Colors.Surface, label: 'Completed' },
    warning: { bg: Colors.Warning, text: Colors.Surface, label: 'At Risk' },
    danger: { bg: Colors.Danger, text: Colors.Surface, label: 'Missed' },
  };

  const { bg, text, label } = config[status];

  return (
    <View style={[styles.badge, styles.statusBadge, { backgroundColor: bg }]}>
      <Text style={[styles.statusText, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.Caption,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.Success,
    borderRadius: Shapes.Badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  streakText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    borderRadius: Shapes.Badge,
  },
  statusText: {
    ...Typography.Micro,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});

export default Badge;
