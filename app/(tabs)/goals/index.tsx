import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PremiumLockedBanner } from '@/components/PremiumLockedBanner';
import { CommonStyles } from '@/constants/commonStyles';
import { getCountLimitedFeatureGate } from '@/constants/featureLimits';
import { Colors, Spacing, Typography, Shapes } from '@/constants/theme';
import { GoalCard } from '@/components/GoalCard';
import { useSubscription } from '@/hooks/useSubscription';
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
  const { isPremium } = useSubscription();
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
  const activeGoalCount = goals.filter((goal) => goal.status === GoalStatus.ACTIVE).length;
  const goalGate = getCountLimitedFeatureGate('activeGoals', isPremium, activeGoalCount);

  const handleCreateGoal = () => {
    if (goalGate.locked) {
      router.push('/premium' as any);
      return;
    }

    router.push('/(tabs)/goals/add-edit' as any);
  };

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
              onPress={handleCreateGoal}
            >
              <Ionicons name="add" size={18} color={Colors.Surface} />
              <Text style={styles.emptyButtonText}>Create Goal</Text>
            </Pressable>
          </View>
        )}

        {goalGate.locked && (
          <View style={styles.premiumBannerWrap}>
            <PremiumLockedBanner
              featureName={goalGate.featureName}
              onUpgrade={() => router.push('/premium' as any)}
            />
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
        onPress={handleCreateGoal}
      >
        <Ionicons name="add" size={26} color={Colors.Surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    ...CommonStyles.listHeader,
  },
  headerLeft: {
    ...CommonStyles.listHeaderLeft,
  },
  title: {
    ...CommonStyles.listHeaderTitle,
  },
  subtitle: {
    ...CommonStyles.listHeaderSubtitle,
  },
  scrollContent: {
    ...CommonStyles.listContent,
    paddingBottom: Spacing.md,
  },
  chipContainer: {
    ...CommonStyles.filterChipRowContainer,
  },
  chipContent: {
    ...CommonStyles.filterChipRowContent,
  },
  chip: {
    ...CommonStyles.filterChip,
  },
  chipSelected: {
    ...CommonStyles.filterChipSelected,
  },
  chipLabel: {
    ...CommonStyles.filterChipLabel,
  },
  chipLabelSelected: {
    ...CommonStyles.filterChipLabelSelected,
  },
  emptyState: {
    ...CommonStyles.emptyStateCentered,
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
  premiumBannerWrap: {
    marginBottom: Spacing.md,
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
    ...CommonStyles.floatingFab,
  },
});
