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
import { CommonStyles } from '@/constants/commonStyles';
import {
  FREE_TIER_LIMITS,
  canEditActivityLog,
  getActivityEditDeadline,
  isActivityEditWindowExpiredError,
} from '@/constants/featureLimits';
import { safeBack } from '@/navigation/safeBack';
import { addActivity, getActivityById, updateActivity } from '@/stores/activityStore';
import { ActivityCategory, ActivityIntensity } from '@/types/models';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatDeadline(deadline: Date | null): string | null {
  if (!deadline) return null;

  return deadline.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
  const [isSaving, setIsSaving] = useState(false);
  const [originalLoggedAt, setOriginalLoggedAt] = useState<string | null>(null);

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
        setOriginalLoggedAt(activity.loggedAt);
      }
      setIsLoading(false);
    };

    loadActivity();
  }, [id, isEditing]);

  const isEditLocked = isEditing && !!originalLoggedAt && !canEditActivityLog(originalLoggedAt);
  const editDeadline = originalLoggedAt ? getActivityEditDeadline(originalLoggedAt) : null;
  const deadlineLabel = formatDeadline(editDeadline);

  const handleSave = async () => {
    if (isLoading || isSaving) return;

    if (isEditLocked) {
      Alert.alert(
        'Editing Locked',
        `Activities can only be edited within ${FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS} hours of logging.`,
      );
      return;
    }

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

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateActivity(id as string, activityData);
      } else {
        await addActivity(activityData);
      }
      safeBack(router, '/(tabs)/track/activity');
    } catch (error) {
      console.error('Failed to save activity:', error);
      if (isActivityEditWindowExpiredError(error)) {
        Alert.alert(
          'Editing Locked',
          `This activity is past the ${FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS}-hour edit window.`,
        );
      } else {
        Alert.alert('Error', 'Failed to save activity. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const canSave =
    !isEditLocked &&
    name.trim().length > 0 &&
    duration.trim().length > 0 &&
    Number(duration) > 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => safeBack(router, '/(tabs)/track/activity')} style={styles.headerBtn}>
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
          onPress={() => safeBack(router, '/(tabs)/track/activity')}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditLocked ? 'Activity Details' : isEditing ? 'Edit Activity' : 'Log Activity'}
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
        {isEditing && originalLoggedAt && (
          <View style={[styles.editBanner, isEditLocked ? styles.editBannerLocked : styles.editBannerActive]}>
            <View style={styles.editBannerIcon}>
              <Ionicons
                name={isEditLocked ? 'lock-closed' : 'time-outline'}
                size={18}
                color={isEditLocked ? Colors.Warning : Colors.SteelBlue}
              />
            </View>
            <View style={styles.editBannerContent}>
              <Text style={styles.editBannerTitle}>
                {isEditLocked ? 'Edit window closed' : 'Edit window active'}
              </Text>
              <Text style={styles.editBannerText}>
                {isEditLocked
                  ? `Activities stay editable for ${FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS} hours after logging.`
                  : deadlineLabel
                    ? `You can edit this activity until ${deadlineLabel}.`
                    : `Activities stay editable for ${FREE_TIER_LIMITS.ACTIVITY_EDIT_WINDOW_HOURS} hours after logging.`}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.label}>ACTIVITY NAME</Text>
        <View style={[styles.inputWrapper, isEditLocked && styles.inputWrapperLocked]}>
          <Ionicons name="flash-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="What did you do?"
            placeholderTextColor={Colors.DustyTaupe}
            value={name}
            onChangeText={setName}
            maxLength={50}
            editable={!isEditLocked}
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
                disabled={isEditLocked}
                onPress={() => setCategory(cat.key as ActivityCategory)}
                style={({ pressed }) => [
                  styles.categoryItem,
                  isActive && styles.categoryItemActive,
                  isActive && { borderColor: catColor },
                  isEditLocked && styles.optionDisabled,
                  { transform: [{ scale: pressed && !isEditLocked ? 0.96 : 1 }] },
                ]}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: `${catColor}18` }]}>
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
                disabled={isEditLocked}
                onPress={() => setDuration(String(mins))}
                style={({ pressed }) => [
                  styles.durationChip,
                  isSelected && styles.durationChipSelected,
                  isEditLocked && styles.optionDisabled,
                  { transform: [{ scale: pressed && !isEditLocked ? 0.94 : 1 }] },
                ]}
              >
                <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.inputWrapper, isEditLocked && styles.inputWrapperLocked]}>
          <Ionicons name="timer-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Custom duration"
            placeholderTextColor={Colors.DustyTaupe}
            value={duration}
            onChangeText={setDuration}
            keyboardType="decimal-pad"
            editable={!isEditLocked}
          />
          <Text style={styles.inputSuffix}>min</Text>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, styles.labelSpaced]}>DATE</Text>
            <View style={[styles.inputWrapper, isEditLocked && styles.inputWrapperLocked]}>
              <Ionicons name="calendar-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.DustyTaupe}
                value={date}
                onChangeText={setDate}
                editable={!isEditLocked}
              />
            </View>
          </View>
          <View style={{ width: Spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, styles.labelSpaced]}>TIME</Text>
            <View style={[styles.inputWrapper, isEditLocked && styles.inputWrapperLocked]}>
              <Ionicons name="time-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="HH:mm"
                placeholderTextColor={Colors.DustyTaupe}
                value={time}
                onChangeText={setTime}
                editable={!isEditLocked}
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
                disabled={isEditLocked}
                onPress={() => setIntensity(int.key as ActivityIntensity)}
                style={({ pressed }) => [
                  styles.intensityOption,
                  isActive && styles.intensityOptionActive,
                  isActive && { borderColor: int.color },
                  isEditLocked && styles.optionDisabled,
                  { transform: [{ scale: pressed && !isEditLocked ? 0.98 : 1 }] },
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
        <View style={[styles.inputWrapper, styles.textAreaWrapper, isEditLocked && styles.inputWrapperLocked]}>
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
            editable={!isEditLocked}
          />
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + Spacing.md + 70 }]}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || isSaving || isLoading}
          style={({ pressed }) => [
            styles.ctaButton,
            (!canSave || isSaving || isLoading) && styles.ctaButtonDisabled,
            { transform: [{ scale: pressed && canSave && !isSaving && !isLoading ? 0.98 : 1 }] },
          ]}
        >
          <Ionicons
            name={isEditLocked ? 'lock-closed' : 'checkmark-circle'}
            size={20}
            color={Colors.Surface}
            style={{ marginRight: Spacing.sm }}
          />
          <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
            {isEditLocked ? 'Editing Locked' : isEditing ? 'Save Changes' : 'Log Activity'}
          </Text>
        </Pressable>
      </View>
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
  scrollContent: {
    ...CommonStyles.formScrollContent,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  editBannerActive: {
    backgroundColor: `${Colors.SoftSky}20`,
    borderColor: `${Colors.SteelBlue}55`,
  },
  editBannerLocked: {
    backgroundColor: `${Colors.WarmSand}90`,
    borderColor: `${Colors.Warning}55`,
  },
  editBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.Surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBannerContent: {
    flex: 1,
    gap: 2,
  },
  editBannerTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  editBannerText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  label: {
    ...CommonStyles.sectionLabel,
  },
  labelSpaced: {
    ...CommonStyles.sectionLabelSpaced,
  },
  inputWrapper: {
    ...CommonStyles.inputWrapper,
  },
  inputWrapperLocked: {
    opacity: 0.7,
  },
  inputIcon: {
    ...CommonStyles.inputIcon,
  },
  input: {
    ...CommonStyles.input,
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
  optionDisabled: {
    opacity: 0.55,
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
    ...CommonStyles.textAreaWrapper,
  },
  textAreaIcon: {
    ...CommonStyles.textAreaIcon,
  },
  textArea: {
    ...CommonStyles.textArea,
  },
  ctaContainer: {
    ...CommonStyles.ctaContainer,
  },
  ctaButton: {
    ...CommonStyles.primaryCtaButton,
  },
  ctaButtonDisabled: {
    ...CommonStyles.primaryCtaButtonDisabled,
  },
  ctaText: {
    ...CommonStyles.primaryCtaText,
  },
  ctaTextDisabled: {
    ...CommonStyles.primaryCtaTextDisabled,
  },
});
