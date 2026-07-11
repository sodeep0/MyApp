import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Shadows, Shapes, Spacing, Typography } from '@/constants/theme';
import { HabitCategory, type Habit } from '@/types/models';

function getHabitCategoryLabel(category: HabitCategory) {
  if (category === HabitCategory.HEALTH) return 'Health';
  if (category === HabitCategory.MIND) return 'Mind';
  if (category === HabitCategory.WORK) return 'Work';
  if (category === HabitCategory.PERSONAL) return 'Personal';
  return 'Custom';
}

type HomeHabitSectionProps = {
  habits: Habit[];
  todayDone: Set<string>;
  onSeeAll: () => void;
  onHabitPress: (habitId: string) => void;
  onToggleComplete: (habitId: string) => void;
};

export function HomeHabitSection({
  habits,
  todayDone,
  onSeeAll,
  onHabitPress,
  onToggleComplete,
}: HomeHabitSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today&apos;s Habits</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.sectionAction}>See all</Text>
        </Pressable>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={24} color={Colors.DustyTaupe} />
          <Text style={styles.emptyStateTitle}>No habits yet</Text>
          <Text style={styles.emptyStateCaption}>
            Create one to start your day with intent.
          </Text>
        </View>
      ) : (
        <View style={styles.habitList}>
          {habits.map((habit) => {
            const completed = todayDone.has(habit.id);
            const category = getHabitCategoryLabel(habit.category);
            const badgeBg = completed ? Colors.Success + '20' : Colors.SoftSky + '2A';
            const badgeColor = completed ? Colors.Success : Colors.SteelBlue;

            return (
              <Pressable
                key={habit.id}
                onPress={() => onHabitPress(habit.id)}
                accessibilityRole="button"
                accessibilityLabel={`Habit ${habit.name || 'Untitled Habit'}`}
                style={({ pressed }) => [
                  styles.habitCard,
                  { transform: [{ scale: pressed ? 0.99 : 1 }] },
                ]}
              >
                <View style={styles.habitLeft}>
                  <View
                    style={[
                      styles.habitIconCircle,
                      {
                        borderColor: completed ? Colors.Success : Colors.SteelBlue,
                        backgroundColor: completed
                          ? Colors.Success + '12'
                          : Colors.SteelBlue + '10',
                      },
                    ]}
                  >
                    <Ionicons
                      name={completed ? 'checkmark' : 'ellipse-outline'}
                      size={18}
                      color={completed ? Colors.Success : Colors.SteelBlue}
                    />
                  </View>

                  <View style={styles.habitTextBlock}>
                    <Text
                      style={[styles.habitName, completed && styles.habitNameDone]}
                      numberOfLines={1}
                    >
                      {habit.name || 'Untitled Habit'}
                    </Text>
                    <View style={[styles.habitBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.habitBadgeText, { color: badgeColor }]}>
                        {category}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable onPress={() => onToggleComplete(habit.id)} hitSlop={8}>
                  <Ionicons
                    name={completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={completed ? Colors.Success : Colors.DustyTaupe}
                  />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  sectionAction: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  emptyState: {
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  emptyStateTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600' as const,
  },
  emptyStateCaption: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center' as const,
  },
  habitList: {
    gap: Spacing.sm,
  },
  habitCard: {
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.Card,
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  habitIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTextBlock: {
    flex: 1,
    gap: 4,
  },
  habitName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600' as const,
  },
  habitNameDone: {
    color: Colors.TextSecondary,
    textDecorationLine: 'line-through' as const,
  },
  habitBadge: {
    alignSelf: 'flex-start',
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  habitBadgeText: {
    ...Typography.Micro,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
  },
});
