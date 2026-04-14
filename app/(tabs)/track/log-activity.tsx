import React, { useState, useEffect } from 'react';
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
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { addActivity, getActivityById, updateActivity } from '@/stores/activityStore';
import { ActivityCategory, ActivityIntensity } from '@/types/models';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const CATEGORIES = [
  { key: 'EXERCISE', label: 'Exercise', icon: 'fitness-outline' as const },
  { key: 'WORK', label: 'Work', icon: 'briefcase-outline' as const },
  { key: 'LEARNING', label: 'Learning', icon: 'book-outline' as const },
  { key: 'SOCIAL', label: 'Social', icon: 'people-outline' as const },
  { key: 'REST', label: 'Rest', icon: 'moon-outline' as const },
  { key: 'CHORES', label: 'Chores', icon: 'home-outline' as const },
  { key: 'CREATIVE', label: 'Creative', icon: 'color-palette-outline' as const },
  { key: 'CUSTOM', label: 'Custom', icon: 'star-outline' as const },
];

const CATEGORY_COLORS: Record<string, string> = {
  EXERCISE: Colors.Success,
  WORK: Colors.SteelBlue,
  LEARNING: Colors.Warning,
  SOCIAL: Colors.SoftSky,
  REST: Colors.DustyTaupe,
  CHORES: Colors.TextSecondary,
  CREATIVE: Colors.SoftSky,
  CUSTOM: Colors.DustyTaupe,
};

const INTENSITIES = [
  { key: 'LOW', label: 'Low', description: 'Light effort', color: Colors.TextSecondary },
  { key: 'MEDIUM', label: 'Medium', description: 'Moderate effort', color: Colors.Warning },
  { key: 'HIGH', label: 'High', description: 'Intense effort', color: Colors.Success },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export default function LogActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, name: prefillName } = useLocalSearchParams();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);

  const [name, setName] = useState(
    typeof prefillName === 'string' ? prefillName : '',
  );
  const [category, setCategory] = useState<ActivityCategory>(ActivityCategory.EXERCISE);
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [intensity, setIntensity] = useState<ActivityIntensity>(ActivityIntensity.MEDIUM);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    const loadActivity = async () => {
      const activity = await getActivityById(id as string);
      if (activity) {
        setName(activity.name);
        setCategory(activity.category);
        setDuration(activity.durationMinutes.toString());
        setDate(activity.date);
        setTime(activity.time);
        setIntensity(activity.intensity);
        setNotes(activity.notes || '');
      }
      setIsLoading(false);
    };
    loadActivity();
  }, [id, isEditing]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter an activity name.');
      return;
    }
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) <= 0) {
      Alert.alert('Missing Duration', 'Please enter a valid duration in minutes.');
      return;
    }

    const activityData = {
      userId: 'local',
      name: name.trim(),
      category,
      durationMinutes: Number(duration),
      date,
      time,
      intensity,
      notes: notes.trim() || null,
    };

    if (isEditing) {
      await updateActivity(id as string, activityData);
    } else {
      await addActivity(activityData);
    }
    router.back();
  };

  const canSave = name.trim().length > 0 && duration.trim().length > 0 && Number(duration) > 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Loading...</Text>
            <Text style={styles.headerSubtitle}>{getDateString()}</Text>
          </View>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Activity' : 'Log Activity'}
          </Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>ACTIVITY NAME</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="flash-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="What did you do?"
            placeholderTextColor={Colors.DustyTaupe}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.key;
            const catColor = CATEGORY_COLORS[cat.key] || Colors.DustyTaupe;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key as ActivityCategory)}
                style={({ pressed }) => [
                  styles.categoryItem,
                  isActive && styles.categoryItemActive,
                  isActive && { borderColor: catColor },
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: catColor + '18' }]}>
                  <Ionicons name={cat.icon} size={20} color={isActive ? catColor : Colors.TextSecondary} />
                </View>
                <Text style={[styles.categoryItemLabel, isActive && { color: catColor, fontWeight: '600' }]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>DURATION (MINUTES)</Text>
        <View style={styles.durationPresets}>
          {DURATION_PRESETS.map((mins) => {
            const isSelected = duration === String(mins);
            return (
              <Pressable
                key={mins}
                onPress={() => setDuration(String(mins))}
                style={({ pressed }) => [
                  styles.durationChip,
                  isSelected && styles.durationChipSelected,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.inputWrapper}>
          <Ionicons name="timer-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Custom duration"
            placeholderTextColor={Colors.DustyTaupe}
            value={duration}
            onChangeText={setDuration}
            keyboardType="decimal-pad"
          />
          <Text style={styles.inputSuffix}>min</Text>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, styles.labelSpaced]}>DATE</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.DustyTaupe}
                value={date}
                onChangeText={setDate}
              />
            </View>
          </View>
          <View style={{ width: Spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, styles.labelSpaced]}>TIME</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="time-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="HH:mm"
                placeholderTextColor={Colors.DustyTaupe}
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>INTENSITY</Text>
        <View style={styles.intensityColumn}>
          {INTENSITIES.map((int) => {
            const isActive = intensity === int.key;
            return (
              <Pressable
                key={int.key}
                onPress={() => setIntensity(int.key as ActivityIntensity)}
                style={({ pressed }) => [
                  styles.intensityOption,
                  isActive && styles.intensityOptionActive,
                  isActive && { borderColor: int.color },
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <View style={styles.intensityRadio}>
                  {isActive && <View style={[styles.intensityRadioDot, { backgroundColor: int.color }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.intensityLabel, isActive && { color: int.color }]}>
                    {int.label}
                  </Text>
                  <Text style={styles.intensityDesc}>{int.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>NOTES (OPTIONAL)</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <Ionicons name="document-text-outline" size={18} color={Colors.TextSecondary} style={[styles.inputIcon, styles.textAreaIcon]} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional details..."
            placeholderTextColor={Colors.DustyTaupe}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

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
          <Ionicons name="checkmark-circle" size={20} color={Colors.Surface} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
            {isEditing ? 'Save Changes' : 'Log Activity'}
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
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },
  inputSuffix: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginLeft: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    gap: Spacing.xs,
    ...Shadows.Card,
  },
  categoryItemActive: {
    borderWidth: 2,
    backgroundColor: Colors.Surface,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItemLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  durationPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  durationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },
  durationChipSelected: {
    backgroundColor: Colors.SoftSky,
    borderColor: Colors.SteelBlue,
  },
  durationChipText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  durationChipTextSelected: {
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
  },
  intensityColumn: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  intensityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    ...Shadows.Card,
  },
  intensityOptionActive: {
    backgroundColor: Colors.Surface,
  },
  intensityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.DustyTaupe,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  intensityLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  intensityDesc: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: Spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ctaContainer: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
  },
  ctaButton: {
    borderRadius: Shapes.Button,
    backgroundColor: Colors.SteelBlue,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    color: Colors.Surface,
    opacity: 0.7,
  },
});
