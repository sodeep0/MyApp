import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes } from '@/constants/theme';
import {
  addJournalEntry,
  updateJournalEntry,
  getJournalEntryById,
  upsertJournalEntryForDate,
} from '@/stores/journalStore';

const MOOD_OPTIONS = [
  { score: 1, icon: 'sad-outline' as const, label: 'Awful', color: Colors.Danger },
  { score: 2, icon: 'cloud-outline' as const, label: 'Bad', color: Colors.Warning },
  { score: 3, icon: 'remove-outline' as const, label: 'Okay', color: Colors.DustyTaupe },
  { score: 4, icon: 'happy-outline' as const, label: 'Good', color: Colors.SteelBlue },
  { score: 5, icon: 'happy' as const, label: 'Great', color: Colors.Success },
];

const SUGGESTED_TAGS = [
  'Gratitude', 'Stress', 'Exercise', 'Work', 'Family',
  'Health', 'Learning', 'Meditation', 'Friends', 'Creativity',
];

const WRITING_PROMPTS = [
  'What are you grateful for today?',
  'What challenged you today?',
  'How did you take care of yourself?',
  'What would make tomorrow better?',
];

export default function JournalEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [moodScore, setMoodScore] = useState(0);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [promptIndex] = useState(Math.floor(Math.random() * WRITING_PROMPTS.length));
  const [showPrompt, setShowPrompt] = useState(true);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef('');
  const lastSavedMood = useRef(0);

  useEffect(() => {
    if (!isEditing) return;
    const loadEntry = async () => {
      const entry = await getJournalEntryById(id as string);
      if (entry) {
        setMoodScore(entry.moodScore);
        try {
          const parsed = JSON.parse(entry.contentJson);
          setContent(typeof parsed === 'string' ? parsed : entry.contentJson);
        } catch {
          setContent(entry.contentJson);
        }
        setTags(entry.tags);
        lastSavedContent.current = entry.contentJson;
        lastSavedMood.current = entry.moodScore;
      }
      setLoading(false);
    };
    loadEntry();
  }, [id, isEditing]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    if (moodScore === 0 || !content.trim()) return;

    autoSaveTimer.current = setTimeout(async () => {
      const contentJson = JSON.stringify(content);
      if (contentJson === lastSavedContent.current && moodScore === lastSavedMood.current) return;

      setSaving(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        if (isEditing && id) {
          await updateJournalEntry(id as string, {
            moodScore,
            contentJson,
            tags,
          });
        } else {
          await upsertJournalEntryForDate(today, {
            moodScore,
            contentJson,
            tags,
          });
          lastSavedContent.current = contentJson;
          lastSavedMood.current = moodScore;
        }
      } catch {
        // silent fail on auto-save
      }
      setSaving(false);
    }, 5000);
  }, [moodScore, content, tags, isEditing, id]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [content, moodScore, tags, triggerAutoSave]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addCustomTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (moodScore === 0) {
      Alert.alert('Select Mood', 'Please tap a mood before saving.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Write Something', 'Add some text to your journal entry.');
      return;
    }

    const contentJson = JSON.stringify(content);
    setSaving(true);

    try {
      if (isEditing && id) {
        await updateJournalEntry(id as string, {
          moodScore,
          contentJson,
          tags,
        });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        await addJournalEntry({
          userId: 'local',
          date: today,
          moodScore,
          contentJson,
          tags,
          photoUris: [],
        });
      }
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const canSave = moodScore > 0 && content.trim().length > 0;
  const currentPrompt = WRITING_PROMPTS[promptIndex];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Entry' : 'New Entry'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.TextSecondary} />
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        {/* Mood Selector */}
        <Text style={styles.label}>HOW ARE YOU FEELING?</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((mood) => {
            const isActive = moodScore === mood.score;
            return (
              <Pressable
                key={mood.score}
                onPress={() => setMoodScore(mood.score)}
                style={({ pressed }) => [
                  styles.moodItem,
                  isActive && styles.moodItemActive,
                  { transform: [{ scale: pressed ? 0.92 : 1 }] },
                ]}
              >
                <Ionicons
                  name={mood.icon}
                  size={26}
                  color={isActive ? mood.color : Colors.TextSecondary}
                />
                <Text style={[styles.moodLabel, isActive && { color: mood.color, fontWeight: '600' }]}>
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Writing Prompt (dismissible) */}
        {showPrompt && !isEditing && (
          <View style={styles.promptCard}>
            <Ionicons name="bulb-outline" size={16} color={Colors.Warning} />
            <Text style={styles.promptText} numberOfLines={2}>{currentPrompt}</Text>
            <Pressable onPress={() => setShowPrompt(false)} hitSlop={8}>
              <Ionicons name="close" size={16} color={Colors.TextSecondary} />
            </Pressable>
          </View>
        )}

        <Text style={[styles.label, styles.labelSpaced]}>WRITE YOUR THOUGHTS</Text>
        <View style={styles.contentWrapper}>
          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind today..."
            placeholderTextColor={Colors.TextSecondary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>
        <View style={styles.contentMeta}>
          <Text style={styles.metaText}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
          {saving && (
            <Text style={styles.savingText}>Saving...</Text>
          )}
        </View>

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
            {SUGGESTED_TAGS.map((tag) => {
              const isSelected = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={({ pressed }) => [
                    styles.tagChip,
                    isSelected && styles.tagChipSelected,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <Text style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}>
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.customTagRow}>
            <View style={styles.customTagInputWrapper}>
              <Ionicons name="pricetag-outline" size={16} color={Colors.TextSecondary} style={{ marginRight: Spacing.sm }} />
              <TextInput
                style={styles.customTagInput}
                placeholder="Add a tag..."
                placeholderTextColor={Colors.DustyTaupe}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addCustomTag}
                returnKeyType="done"
              />
            </View>
            <Pressable
              onPress={addCustomTag}
              style={({ pressed }) => [
                styles.addTagBtn,
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <Ionicons name="add" size={20} color={Colors.SteelBlue} />
            </Pressable>
          </View>

          {tags.length > 0 && (
            <View style={styles.selectedTagsRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{tag}</Text>
                  <Pressable onPress={() => removeTag(tag)} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={Colors.TextSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + Spacing.md + 70 }]}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.ctaButton,
            !canSave && styles.ctaButtonDisabled,
            { transform: [{ scale: pressed && canSave ? 0.98 : 1 }] },
          ]}
        >
          <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
            {isEditing ? 'Save Changes' : 'Save Entry'}
          </Text>
        </Pressable>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.WarmSand + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dateLabel: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  label: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  labelSpaced: {
    marginTop: Spacing.lg,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    gap: Spacing.xs,
  },
  moodItemActive: {
    borderWidth: 2,
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SoftSky + '30',
  },
  moodLabel: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Card,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  promptText: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  contentWrapper: {
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 180,
  },
  contentInput: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  contentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  metaText: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
  },
  savingText: {
    ...Typography.Micro,
    color: Colors.SteelBlue,
  },
  tagSection: {
    gap: Spacing.sm,
  },
  tagScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
  },
  tagChipSelected: {
    backgroundColor: Colors.SoftSky,
    borderColor: Colors.SteelBlue,
  },
  tagChipText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    textTransform: 'uppercase' as const,
  },
  tagChipTextSelected: {
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customTagInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.DustyTaupe,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  customTagInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  addTagBtn: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.WarmSand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.SoftSky,
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  selectedTagText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
  },
  ctaButton: {
    backgroundColor: Colors.SteelBlue,
    height: 52,
    borderRadius: Shapes.Button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.Surface,
    letterSpacing: 0.4,
  },
  ctaTextDisabled: {
    opacity: 0.7,
  },
});
