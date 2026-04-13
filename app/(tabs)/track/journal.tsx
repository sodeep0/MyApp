import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
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
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    const data = await getAllJournalEntries();
    setEntries(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Journal</Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.newEntryBtn, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          onPress={() => router.push('/track/journal-entry' as any)}
        >
          <Ionicons name="add" size={18} color={Colors.Surface} />
          <Text style={styles.newEntryBtnText}>New Entry</Text>
        </Pressable>
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
              onPress={() => router.push('/track/journal-entry' as any)}
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
      </ScrollView>
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
  newEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.SteelBlue,
    borderRadius: Shapes.PillButton,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexShrink: 0,
  },
  newEntryBtnText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: '700',
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
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.SoftSky + '20',
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
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.Card,
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
});