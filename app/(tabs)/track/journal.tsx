import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  InteractionManager,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PremiumLockedBanner } from '@/components/PremiumLockedBanner';
import { CommonStyles } from '@/constants/commonStyles';
import { getCountLimitedFeatureGate } from '@/constants/featureLimits';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { safeBack } from '@/navigation/safeBack';
import { requestJournalAccess } from '@/services/journalGate';
import { getAllJournalEntries } from '@/stores/journalStore';
import type { JournalEntry } from '@/types/models';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const MOOD_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  'sad-outline',
  'alert-circle-outline',
  'remove-outline',
  'happy-outline',
  'happy',
];

const MOOD_COLORS: string[] = [
  Colors.Danger,
  Colors.Warning,
  Colors.DustyTaupe,
  Colors.SoftSky,
  Colors.Success,
];

export default function JournalListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isPremium } = useSubscription();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    const data = await getAllJournalEntries();
    setEntries(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const ensureAccessAndLoad = async () => {
        setLoading(true);
        const granted = await requestJournalAccess({
          router,
          onCancelled: () => safeBack(router, '/(tabs)/track'),
          onUnavailableBack: () => safeBack(router, '/(tabs)/track'),
        });
        if (!isActive || !granted) {
          setLoading(false);
          return;
        }

        await loadData();
        if (!isActive) return;
        setLoading(false);
      };

      const task = InteractionManager.runAfterInteractions(() => {
        void ensureAccessAndLoad();
      });

      return () => {
        isActive = false;
        task.cancel();
      };
    }, [loadData, router]),
  );

  const filteredEntries = searchQuery
    ? entries.filter((e) => {
        const q = searchQuery.toLowerCase();
        return (
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          e.contentJson.toLowerCase().includes(q)
        );
      })
    : entries;

  const journalGate = getCountLimitedFeatureGate('journalEntries', isPremium, entries.length);

  const handleCreateEntry = () => {
    if (journalGate.locked) {
      router.push('/premium' as any);
      return;
    }

    router.push('/track/journal-entry' as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/(tabs)/track')} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.TextSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search entries..."
          placeholderTextColor={Colors.TextSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarStrip}>
          {(() => {
            const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return days.map((day, i) => {
              const d = new Date(startOfWeek);
              d.setDate(startOfWeek.getDate() + i);
              const isToday = d.toDateString() === today.toDateString();
              return (
                <View key={i} style={[styles.calDay, isToday && styles.calDayActive]}>
                  <Text style={[styles.calDayText, isToday && styles.calDayActiveText]}>{day}</Text>
                  <Text style={[styles.calDate, isToday && styles.calDayActiveText]}>{d.getDate()}</Text>
                </View>
              );
            });
          })()}
        </View>

        {loading ? (
          <Text style={{ ...Typography.Body1, color: Colors.TextSecondary, textAlign: 'center', paddingVertical: Spacing.xxl }}>Loading entries...</Text>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="book-outline" size={44} color={Colors.SteelBlue} />
            </View>
            <Text style={styles.emptyTitle}>No journal entries yet</Text>
            <Text style={styles.emptySub}>Start writing to track your mood and thoughts</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyCta, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
              onPress={handleCreateEntry}
            >
              <Ionicons name="create-outline" size={18} color={Colors.Surface} />
              <Text style={styles.emptyCtaText}>Write First Entry</Text>
            </Pressable>
          </View>
        ) : (
          filteredEntries.map((entry) => {
            const dateLabel = (() => {
              const today = new Date();
              const entryDate = new Date(entry.date);
              const yesterday = new Date();
              yesterday.setDate(today.getDate() - 1);
              if (entryDate.toDateString() === today.toDateString()) return 'Today';
              if (entryDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
              return entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            })();

            let preview = '';
            try {
              const json = JSON.parse(entry.contentJson);
              preview = typeof json === 'string' ? json.substring(0, 120) : '';
            } catch {
              preview = entry.contentJson.substring(0, 120);
            }

            const moodIndex = Math.max(0, Math.min(4, entry.moodScore - 1));
            const moodColor = MOOD_COLORS[moodIndex];

            return (
              <Pressable
                key={entry.id}
                onPress={() => router.push(`/track/journal-entry?id=${entry.id}` as any)}
                style={({ pressed }) => [
                  styles.entryCard,
                  { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <View style={styles.entryCardInner}>
                  <View style={[styles.entryAccent, { backgroundColor: moodColor }]} />
                  <View style={styles.entryContent}>
                    <View style={styles.entryHeader}>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateChipText}>{dateLabel}</Text>
                      </View>
                      <Ionicons
                        name={MOOD_ICONS[moodIndex]}
                        size={22}
                        color={moodColor}
                      />
                    </View>
                    {preview && (
                      <Text style={styles.entryPreview} numberOfLines={2}>
                        {preview}
                      </Text>
                    )}
                    {entry.tags.length > 0 && (
                      <View style={styles.entryTags}>
                        {entry.tags.slice(0, 4).map((tag) => (
                          <View key={tag} style={styles.tagChip}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                        {entry.tags.length > 4 && (
                          <Text style={styles.tagMore}>+{entry.tags.length - 4}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}

        {journalGate.locked && (
          <View style={styles.premiumBannerWrap}>
            <PremiumLockedBanner
              featureName={journalGate.featureName}
              onUpgrade={() => router.push('/premium' as any)}
            />
          </View>
        )}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            right: Spacing.screenH + 22,
            bottom: insets.bottom + 70,
          },
          { transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
        onPress={handleCreateEntry}
      >
        <Ionicons name="add" size={28} color={Colors.Surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    ...CommonStyles.stackHeader,
  },
  headerBtn: {
    ...CommonStyles.stackHeaderButton,
  },
  headerCenter: {
    ...CommonStyles.stackHeaderCenter,
  },
  headerTitle: {
    ...CommonStyles.stackHeaderTitle,
  },
  headerSubtitle: {
    ...CommonStyles.stackHeaderSubtitle,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    height: 52,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.screenH,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xl,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.Card,
  },
  calDay: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Shapes.Chip,
  },
  calDayActive: {
    backgroundColor: Colors.SoftSky + '30',
  },
  calDayText: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
  },
  calDayActiveText: {
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  calDate: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  emptyState: {
    ...CommonStyles.emptyStateCentered,
    paddingVertical: Spacing.xxl,
  },
  emptyIconWrap: {
    ...CommonStyles.emptyIconCircleMd,
    backgroundColor: Colors.SoftSky + '20',
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
    fontWeight: '600',
  },
  entryCard: {
    ...CommonStyles.surfaceCard,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  premiumBannerWrap: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  entryCardInner: {
    flexDirection: 'row',
  },
  entryAccent: {
    width: 4,
    borderTopLeftRadius: Shapes.Card,
    borderBottomLeftRadius: Shapes.Card,
    flexShrink: 0,
  },
  entryContent: {
    flex: 1,
    padding: Spacing.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dateChip: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dateChipText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  entryPreview: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  tagChip: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  tagMore: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
  },
  fab: {
    ...CommonStyles.fabBase,
    backgroundColor: Colors.SteelBlue,
  },
});
