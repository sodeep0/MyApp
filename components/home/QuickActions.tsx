import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

export const HOME_QUICK_ACTIONS = [
  {
    label: 'Habit',
    icon: 'add-circle-outline',
    route: '/(tabs)/habits/add-edit' as const,
  },
  {
    label: 'Log',
    icon: 'create-outline',
    route: '/(tabs)/track/activity' as const,
  },
  {
    label: 'Journal',
    icon: 'book-outline',
    route: '/(tabs)/track/journal' as const,
  },
  {
    label: 'Goals',
    icon: 'flag-outline',
    route: '/(tabs)/goals/add-edit' as const,
  },
] as const;

type QuickActionsProps = {
  onActionPress: (route: string) => void;
};

export function QuickActions({ onActionPress }: QuickActionsProps) {
  return (
    <View style={styles.quickGrid}>
      {HOME_QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.label}
          onPress={() => onActionPress(action.route)}
          style={({ pressed }) => [
            styles.quickCard,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Ionicons name={action.icon as any} size={22} color={Colors.SteelBlue} />
          <Text style={styles.quickLabel}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
  },
  quickCard: {
    width: '48.4%',
    backgroundColor: Colors.SurfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  quickLabel: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
});
