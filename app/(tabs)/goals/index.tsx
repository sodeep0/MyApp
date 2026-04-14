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

type FilterTab = GoalStatus.ACTIVE | GoalStatus.COMPLETED;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: GoalStatus.ACTIVE, label: 'Active' },
  { key: GoalStatus.COMPLETED, label: 'Completed' },
];

export default function GoalListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<FilterTab>(GoalStatus.ACTIVE);
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

  const filteredGoals = goals.filter((goal) => goal.status === activeTab);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Goals</Text>
          <Text style={styles.subtitle}>{getDateString()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipContainer}
          contentContainerStyle={styles.chipContent}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.chip,
                  isActive && styles.chipSelected,
                ]}
              >
                <Text style={[styles.chipLabel, isActive && styles.chipLabelSelected]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        style={[
          styles.fab,
          {
            right: Spacing.screenH + 22,
            bottom: insets.bottom + 70,
          },
        ]}
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
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.md,
  },
  chipContainer: {
    marginBottom: Spacing.lg,
  },
  chipContent: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
  },
  chipSelected: {
    backgroundColor: Colors.SoftSky,
  },
  chipLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipLabelSelected: {
    color: Colors.Surface,
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
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.TextPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.FAB,
  },
});
