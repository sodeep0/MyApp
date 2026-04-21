import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { getAllUrgeEvents, getAllBadHabits } from '@/stores/badHabitStore';
import { getAllActivities } from '@/stores/activityStore';
import { getAllJournalEntries } from '@/stores/journalStore';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

interface ModuleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  count?: string;
  onPress: () => void;
}

type RecentItemType = 'BAD_HABIT' | 'ACTIVITY' | 'JOURNAL';

interface RecentItem {
  id: string;
  type: RecentItemType;
  title: string;
  subtitle: string;
  timestamp: string;
  route: string;
}

function formatRecentTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getRecentTypeMeta(type: RecentItemType): { icon: keyof typeof Ionicons.glyphMap; color: string; label: string } {
  if (type === 'BAD_HABIT') {
    return { icon: 'shield-checkmark-outline', color: Colors.Success, label: 'Bad Habit' };
  }
  if (type === 'ACTIVITY') {
    return { icon: 'bar-chart-outline', color: Colors.Warning, label: 'Activity' };
  }
  return { icon: 'book-outline', color: Colors.SteelBlue, label: 'Journal' };
}

function ModuleCard({ icon, title, description, color, count, onPress }: ModuleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleCard,
        { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View style={[styles.moduleIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.moduleContent}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleDescription}>{description}</Text>
      </View>
      {count !== undefined && (
        <View style={[styles.moduleBadge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.moduleBadgeText, { color }]}>{count}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={Colors.DustyTaupe} />
    </Pressable>
  );
}

export default function TrackHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const loadRecent = useCallback(async () => {
    const [urgeEvents, badHabits, activities, journals] = await Promise.all([
      getAllUrgeEvents(),
      getAllBadHabits(),
      getAllActivities(),
      getAllJournalEntries(),
    ]);

    const badHabitNameById = new Map(badHabits.map((h) => [h.id, h.name]));

    const recentBadHabitItems: RecentItem[] = urgeEvents.map((event) => {
      const habitName = badHabitNameById.get(event.badHabitId) || 'Bad Habit';
      const action = event.type === 'RELAPSE' ? 'Relapse logged' : 'Urge resisted';
      return {
        id: `bh-${event.id}`,
        type: 'BAD_HABIT',
        title: habitName,
        subtitle: action,
        timestamp: event.loggedAt,
        route: `/track/bad-habit-detail?id=${event.badHabitId}`,
      };
    });

    const recentActivityItems: RecentItem[] = activities.map((activity) => ({
      id: `ac-${activity.id}`,
      type: 'ACTIVITY',
      title: activity.name,
      subtitle: `${activity.durationMinutes} min - ${activity.category.toLowerCase()}`,
      timestamp: activity.loggedAt,
      route: `/track/log-activity?id=${activity.id}`,
    }));

    const recentJournalItems: RecentItem[] = journals.map((entry) => {
      let preview = '';
      try {
        const parsed = JSON.parse(entry.contentJson);
        preview = typeof parsed === 'string' ? parsed : '';
      } catch {
        preview = entry.contentJson;
      }
      const cleaned = preview.trim();
      return {
        id: `jr-${entry.id}`,
        type: 'JOURNAL',
        title: cleaned ? cleaned.slice(0, 36) : 'Journal Entry',
        subtitle: entry.tags.length > 0 ? entry.tags.slice(0, 2).join(', ') : 'No tags',
        timestamp: entry.updatedAt || `${entry.date}T00:00:00.000Z`,
        route: `/track/journal-entry?id=${entry.id}`,
      };
    });

    const merged = [...recentBadHabitItems, ...recentActivityItems, ...recentJournalItems]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 3);

    setRecentItems(merged);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent]),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Track</Text>
          <Text style={styles.subtitle}>{getDateString()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modulesList}>
          <ModuleCard
            icon="shield-checkmark-outline"
            title="Bad Habits"
            description="Track addictions and monitor clean streaks"
            color={Colors.Success}
            onPress={() => router.push('/track/bad-habits' as any)}
          />
          <ModuleCard
            icon="book-outline"
            title="Journal"
            description="Daily reflections with mood tracking"
            color={Colors.SteelBlue}
            onPress={() => router.push('/track/journal' as any)}
          />
          <ModuleCard
            icon="bar-chart-outline"
            title="Activity Log"
            description="Log exercise, work, learning, and more"
            color={Colors.Warning}
            onPress={() => router.push('/track/activity' as any)}
          />
        </View>

        {recentItems.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent</Text>
            <View style={styles.recentList}>
              {recentItems.map((item) => {
                const meta = getRecentTypeMeta(item.type);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(item.route as any)}
                    style={({ pressed }) => [
                      styles.recentCard,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <View style={[styles.recentIconWrap, { backgroundColor: `${meta.color}18` }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={styles.recentContent}>
                      <Text style={styles.recentItemTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.recentItemSubtitle} numberOfLines={1}>
                        {meta.label} - {item.subtitle}
                      </Text>
                    </View>
                    <Text style={styles.recentTime}>{formatRecentTime(item.timestamp)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={14} color={Colors.TextSecondary} />
          <Text style={styles.privacyText}>
            All tracked data stays on your device. Never synced or shared.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    ...CommonStyles.listHeader,
    justifyContent: 'space-between',
  },
  headerLeft: {
    ...CommonStyles.listHeaderLeft,
  },
  headerBtn: {
    padding: Spacing.sm,
  },
  title: {
    ...CommonStyles.listHeaderTitle,
  },
  subtitle: {
    ...CommonStyles.listHeaderSubtitle,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  modulesList: {
    paddingHorizontal: Spacing.screenH,
    gap: Spacing.sm,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.Card,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  moduleContent: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
    lineHeight: 24,
  },
  moduleDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
  },
  moduleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
    flexShrink: 0,
  },
  moduleBadgeText: {
    ...Typography.Caption,
    fontWeight: '700',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.WarmSand}60`,
    borderRadius: Shapes.Chip,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.screenH,
    marginTop: Spacing.lg,
  },
  privacyText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  recentSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.screenH,
  },
  recentTitle: {
    ...CommonStyles.sectionLabel,
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  recentList: {
    gap: Spacing.sm,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    ...Shadows.Card,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  recentContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  recentItemTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  recentItemSubtitle: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  recentTime: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    flexShrink: 0,
  },
});
