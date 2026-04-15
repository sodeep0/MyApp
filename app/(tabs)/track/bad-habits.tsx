import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { safeBack } from '@/navigation/safeBack';
import { getAllBadHabits, daysSinceQuit } from '@/stores/badHabitStore';
import type { BadHabit } from '@/types/models';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  SUBSTANCE: Colors.Warning,
  DIGITAL: Colors.SteelBlue,
  BEHAVIORAL: Colors.Success,
  CUSTOM: Colors.DustyTaupe,
};

const CATEGORY_LABELS: Record<string, string> = {
  SUBSTANCE: 'Substance', DIGITAL: 'Digital', BEHAVIORAL: 'Behavioral', CUSTOM: 'Custom',
};

const SEVERITY_LABELS: Record<string, string> = {
  MILD: 'Mild', MODERATE: 'Moderate', SEVERE: 'Severe',
};

const SEVERITY_COLORS: Record<string, string> = {
  MILD: Colors.Success, MODERATE: Colors.Warning, SEVERE: Colors.Danger,
};

function StreakBadge({ days }: { days: number }) {
  const label = days === 1 ? 'day' : 'days';
  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakNumber}>{days}</Text>
      <Text style={styles.streakLabel}>{label} clean</Text>
    </View>
  );
}

export default function BadHabitListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [badHabits, setBadHabits] = useState<BadHabit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const data = await getAllBadHabits();
    setBadHabits(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/track')} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bad Habits</Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ ...Typography.Body1, color: Colors.TextSecondary }}>Loading...</Text>
          </View>
        ) : (
          <>
            {badHabits.length > 0 && (
              <Text style={styles.sectionLabel}>YOUR RECOVERY JOURNEY</Text>
            )}

            {badHabits.map((habit) => {
              const cleanDays = daysSinceQuit(habit.quitDate);
              const categoryColor = CATEGORY_COLORS[habit.category] || Colors.SoftSky;
              return (
                <Pressable
                  key={habit.id}
                  onPress={() => router.push(`/track/bad-habit-detail?id=${habit.id}` as any)}
                  style={({ pressed }) => [
                    styles.habitCard,
                    { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <View style={styles.habitCardTop}>
                    <View style={styles.habitInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                        <View style={styles.habitMetaRow}>
                          <Text style={styles.habitCategory}>
                            {CATEGORY_LABELS[habit.category] || habit.category}
                          </Text>
                          <Text style={styles.habitDot}>·</Text>
                          <Text style={[styles.habitSeverity, { color: SEVERITY_COLORS[habit.severity] || Colors.TextSecondary }]}>
                            {SEVERITY_LABELS[habit.severity] || habit.severity}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <StreakBadge days={cleanDays} />
                  </View>
                  <View style={styles.habitCardFooter}>
                    <Text style={styles.habitSince}>
                      Since {new Date(habit.quitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.DustyTaupe} />
                  </View>
                </Pressable>
              );
            })}

            {badHabits.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="shield-checkmark-outline" size={48} color={Colors.Success} />
                </View>
                <Text style={styles.emptyTitle}>No bad habits tracked</Text>
                <Text style={styles.emptySub}>
                  Add one to start your recovery journey.{'\n'}Your data stays private and encrypted.
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.emptyCta,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                  onPress={() => router.push('/track/add-edit-bad-habit' as any)}
                >
                  <Ionicons name="add" size={20} color={Colors.Surface} />
                  <Text style={styles.emptyCtaText}>Track a Habit</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        <View style={styles.privacyBanner}>
          <Ionicons name="lock-closed" size={14} color={Colors.TextSecondary} />
          <Text style={styles.privacyText}>
            Your data is stored locally and encrypted. It is never synced or shared.
          </Text>
        </View>
      </ScrollView>

      {badHabits.length > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            {
              right: Spacing.screenH + 22,
              bottom: insets.bottom + 70,
            },
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
          onPress={() => router.push('/track/add-edit-bad-habit' as any)}
        >
          <Ionicons name="add" size={28} color={Colors.Surface} />
        </Pressable>
      )}
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
    gap: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.WarmSand + '60',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  headerTitle: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxl,
  },
  sectionLabel: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  habitCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.Card,
  },
  habitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  habitName: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 17,
    lineHeight: 22,
  },
  habitMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  habitCategory: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  habitDot: {
    ...Typography.Caption,
    color: Colors.DustyTaupe,
  },
  habitSeverity: {
    ...Typography.Caption,
    fontWeight: '600',
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: Colors.TextPrimary,
    borderRadius: Shapes.Button,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexShrink: 0,
  },
  streakNumber: {
    ...Typography.Stat,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.Surface,
  },
  streakLabel: {
    ...Typography.Micro,
    color: Colors.SoftSky,
  },
  habitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
  },
  habitSince: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.Success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
  },
  emptySub: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.SteelBlue,
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyCtaText: {
    ...Typography.Body1,
    color: Colors.Surface,
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Chip,
    padding: Spacing.md,
    marginTop: Spacing.md,
    opacity: 0.7,
  },
  privacyText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    flex: 1,
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
