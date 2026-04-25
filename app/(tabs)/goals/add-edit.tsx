import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LoadingState } from '@/components/LoadingState';
import { PremiumLockedBanner } from '@/components/PremiumLockedBanner';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { CommonStyles } from '@/constants/commonStyles';
import { useCountLimitedFeatureGate } from '@/hooks/useFeatureGate';
import { safeBack } from '@/navigation/safeBack';
import { isCountLimitedFeatureLockedError } from '@/services/featureAccess';
import { addGoal, getActiveGoalCount, updateGoal, getGoalById } from '@/stores/goalStore';
import {
  GoalCategory,
  GoalType,
  GoalStatus,
  type Milestone,
} from '@/types/models';
import { generateUUID } from '@/stores/baseStore';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function parseGoalDate(value: string | null | undefined) {
  if (!value) return new Date();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatGoalDate(value: string | null | undefined) {
  if (!value) return 'Choose a date (or leave empty)';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Choose a date (or leave empty)';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function toStoredGoalDate(date: Date) {
  const normalized = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0
  );
  return normalized.toISOString();
}

const CALENDAR_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarMonthDays(displayMonth: Date) {
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const leadingEmptyDays = firstDay.getDay();
  const cells: (number | null)[] = [];

  for (let i = 0; i < leadingEmptyDays; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return {
    label: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    cells,
  };
}

const CATEGORIES = [
  { key: 'FITNESS', label: 'Fitness', icon: 'fitness-outline' as const },
  { key: 'LEARNING', label: 'Learning', icon: 'book-outline' as const },
  { key: 'CAREER', label: 'Career', icon: 'briefcase-outline' as const },
  { key: 'FINANCE', label: 'Finance', icon: 'card-outline' as const },
  { key: 'RELATIONSHIP', label: 'Relationship', icon: 'heart-outline' as const },
  { key: 'PERSONAL', label: 'Personal', icon: 'person-outline' as const },
];

const GOAL_TYPES = [
  { key: 'QUANTITATIVE', label: 'Quantitative', description: 'Trackable with numbers' },
  { key: 'MILESTONE', label: 'Milestone', description: 'Step-by-step checkpoints' },
  { key: 'YES_NO', label: 'Yes/No', description: 'Simple completion goal' },
];

export default function AddEditGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditingMode = !!id;
  const isEditing = isEditingMode;
  const [isLoading, setIsLoading] = useState(isEditingMode);
  const [isSaving, setIsSaving] = useState(false);
  const goalGate = useCountLimitedFeatureGate('activeGoals', getActiveGoalCount, {
    enabled: !isEditing,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(GoalCategory.FITNESS);
  const [goalType, setGoalType] = useState(GoalType.QUANTITATIVE);
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStart(new Date()));
  const [metricName, setMetricName] = useState('');

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    const loadGoal = async () => {
      const goal = await getGoalById(id as string);
      if (goal) {
        setTitle(goal.title);
        setDescription(goal.description || '');
        setCategory(goal.category);
        setGoalType(goal.goalType);
        setTargetValue(goal.targetValue?.toString() || '');
        setUnit(goal.unit || '');
        setTargetDate(goal.targetDate || '');
        setMilestones(goal.milestones);
      }
      setIsLoading(false);
    };
    loadGoal();
  }, [id, isEditing]);

  const addMilestone = () => {
    if (milestoneInput.trim() && milestones.length < 10) {
      const newMilestone: Milestone = {
        id: generateUUID(),
        title: milestoneInput.trim(),
        isCompleted: false,
        completedAt: null,
      };
      setMilestones([...milestones, newMilestone]);
      setMilestoneInput('');
    }
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, idx) => idx !== index));
  };

  const openDatePicker = () => {
    setCalendarMonth(getMonthStart(parseGoalDate(targetDate)));
    setShowDatePicker(true);
  };

  const handleSelectTargetDate = (day: number) => {
    const selectedDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );
    setTargetDate(toStoredGoalDate(selectedDate));
    setShowDatePicker(false);
  };

  const handleClearTargetDate = () => {
    setTargetDate('');
    setShowDatePicker(false);
  };

  const goToPreviousCalendarMonth = () => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextCalendarMonth = () => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const handleSave = async () => {
    if (isLoading || isSaving) return;

    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a goal title.');
      return;
    }
    if (goalType === GoalType.QUANTITATIVE && !targetValue.trim()) {
      Alert.alert('Missing Target', 'Please enter a target value for quantitative goals.');
      return;
    }
    if (goalGate.locked) {
      router.push('/premium' as any);
      return;
    }

    const targetVal = goalType === GoalType.QUANTITATIVE ? parseFloat(targetValue) : null;

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateGoal(id as string, {
          title: title.trim(),
          description: description.trim() || null,
          category,
          goalType,
          targetValue: targetVal,
          unit: unit.trim() || null,
          milestones,
          targetDate: targetDate || null,
        });
      } else {
        await addGoal({
          userId: 'local',
          title: title.trim(),
          description: description.trim() || null,
          category,
          goalType,
          targetValue: targetVal,
          currentValue: 0,
          unit: unit.trim() || null,
          milestones,
          targetDate: targetDate || null,
          linkedHabitIds: [],
          status: GoalStatus.ACTIVE,
        });
      }
      safeBack(router, '/(tabs)/goals');
    } catch (error) {
      if (isCountLimitedFeatureLockedError(error)) {
        await goalGate.refresh();
        Alert.alert('Premium Required', error.message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium' as any) },
        ]);
        return;
      }

      console.error('Failed to save goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave =
    !goalGate.locked &&
    title.trim() &&
    (goalType !== 'QUANTITATIVE' || targetValue.trim());
  const selectedDate = targetDate ? parseGoalDate(targetDate) : null;
  const selectedDay =
    selectedDate &&
    selectedDate.getFullYear() === calendarMonth.getFullYear() &&
    selectedDate.getMonth() === calendarMonth.getMonth()
      ? selectedDate.getDate()
      : null;
  const calendarMonthData = getCalendarMonthDays(calendarMonth);

  if (isLoading) {
    return (
      <LoadingState
        fullScreen
        title="Loading Goal"
        message="Preparing the saved details for editing."
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)/goals')}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Goal' : 'New Goal'}
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
        {!isEditing && goalGate.locked && (
          <View style={styles.premiumBannerWrap}>
            <PremiumLockedBanner
              featureName={goalGate.featureName}
              onUpgrade={() => router.push('/premium' as any)}
            />
          </View>
        )}

        <Text style={styles.label}>Title</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="flag-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="What do you want to achieve?"
            placeholderTextColor={Colors.DustyTaupe}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>
        <Text style={styles.charCount}>{title.length}/80</Text>

        <Text style={[styles.label, styles.labelSpaced]}>Description (optional)</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <Ionicons name="document-text-outline" size={18} color={Colors.TextSecondary} style={[styles.inputIcon, styles.textAreaIcon]} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add more detail about your goal..."
            placeholderTextColor={Colors.DustyTaupe}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>Category</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() => setCategory(cat.key as GoalCategory)}
              style={({ pressed }) => [
                styles.categoryChip,
                category === cat.key && styles.categoryChipActive,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={category === cat.key ? Colors.TextPrimary : Colors.TextSecondary}
              />
              <Text
                style={[
                  styles.categoryChipLabel,
                  category === cat.key && styles.categoryChipLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, styles.labelSpaced]}>Goal Type</Text>
        <View style={styles.goalTypeColumn}>
          {GOAL_TYPES.map((type) => {
            const isActive = goalType === type.key;
            return (
              <Pressable
                key={type.key}
                onPress={() => setGoalType(type.key as GoalType)}
                style={[
                  styles.goalTypeOption,
                  isActive && styles.goalTypeOptionActive,
                ]}
              >
                <View style={styles.goalTypeRadio}>
                  {isActive && <View style={styles.goalTypeRadioDot} />}
                </View>
                <View>
                  <Text style={[styles.goalTypeLabel, isActive && styles.goalTypeLabelActive]}>
                    {type.label}
                  </Text>
                  <Text style={styles.goalTypeDesc}>{type.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {goalType === 'QUANTITATIVE' && (
          <>
            <Text style={[styles.label, styles.labelSpaced]}>Target & Unit</Text>
            <View style={styles.targetRow}>
              <View style={styles.targetField}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor={Colors.DustyTaupe}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.targetField}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="km, hrs..."
                    placeholderTextColor={Colors.DustyTaupe}
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.label, styles.labelSpaced]}>Metric Name (optional)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="analytics-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Distance run, Pages read"
                placeholderTextColor={Colors.DustyTaupe}
                value={metricName}
                onChangeText={setMetricName}
                maxLength={50}
              />
            </View>
          </>
        )}

        <Text style={[styles.label, styles.labelSpaced]}>Target Date</Text>
        <Pressable
          onPress={openDatePicker}
          style={({ pressed }) => [
            styles.datePickerButton,
            showDatePicker && styles.datePickerButtonActive,
            { transform: [{ scale: pressed ? 0.99 : 1 }] },
          ]}
        >
          <Ionicons name="calendar-outline" size={18} color={Colors.TextSecondary} />
          <Text
            style={[
              styles.dateText,
              !targetDate && styles.dateTextPlaceholder,
            ]}
          >
            {formatGoalDate(targetDate)}
          </Text>
          <Ionicons
            name={showDatePicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.TextSecondary}
          />
        </Pressable>
        {targetDate ? (
          <Pressable
            onPress={handleClearTargetDate}
            style={({ pressed }) => [
              styles.clearDateButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.clearDateText}>Clear date</Text>
          </Pressable>
        ) : null}

        {goalType === 'MILESTONE' && (
          <>
            <Text style={[styles.label, styles.labelSpaced]}>Milestones</Text>

            {milestones.map((m, i) => (
              <View key={i} style={styles.milestoneRow}>
                <View style={styles.milestoneNumber}>
                  <Text style={styles.milestoneNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.milestoneText} numberOfLines={2}>
                  {m.title}
                </Text>
                <Pressable
                  onPress={() => removeMilestone(i)}
                  style={styles.removeMilestoneBtn}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.Danger} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addMilestoneRow}>
              <View style={styles.addMilestoneInputWrapper}>
                <Ionicons name="list-outline" size={16} color={Colors.TextSecondary} style={styles.addMilestoneIcon} />
                <TextInput
                  style={styles.addMilestoneInput}
                  placeholder="Add a milestone..."
                  placeholderTextColor={Colors.DustyTaupe}
                  value={milestoneInput}
                  onChangeText={setMilestoneInput}
                  maxLength={100}
                  onSubmitEditing={addMilestone}
                  returnKeyType="done"
                />
              </View>
              <Pressable
                onPress={addMilestone}
                style={({ pressed }) => [
                  styles.addMilestoneBtn,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Ionicons name="add" size={20} color={Colors.SteelBlue} />
              </Pressable>
            </View>

            <Text style={styles.milestoneHint}>
              {milestones.length}/10 milestones added
            </Text>
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + Spacing.md + 70 }]}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.ctaButton,
            !canSave && styles.ctaButtonDisabled,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          disabled={!canSave || isSaving || isLoading}
        >
          <LinearGradient
            colors={[Colors.SteelBlue, Colors.TextPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.ctaGradient,
              !canSave && styles.ctaGradientDisabled,
            ]}
          >
            <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
              {isEditing ? 'Save Changes' : 'Create Goal'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={styles.calendarModalCard}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalEyebrow}>TARGET DATE</Text>
              <Text style={styles.calendarModalTitle}>Choose a day</Text>
            </View>

            <View style={styles.calendarHeader}>
              <Pressable
                onPress={goToPreviousCalendarMonth}
                style={({ pressed }) => [
                  styles.calendarNavButton,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={Colors.TextPrimary} />
              </Pressable>
              <View style={styles.calendarHeaderCenter}>
                <Ionicons name="calendar-outline" size={18} color={Colors.SteelBlue} />
                <Text style={styles.calendarTitle}>{calendarMonthData.label}</Text>
              </View>
              <Pressable
                onPress={goToNextCalendarMonth}
                style={({ pressed }) => [
                  styles.calendarNavButton,
                  { transform: [{ scale: pressed ? 0.94 : 1 }] },
                ]}
              >
                <Ionicons name="chevron-forward" size={18} color={Colors.TextPrimary} />
              </Pressable>
            </View>

            <View style={styles.calendarDays}>
              {CALENDAR_DAY_LABELS.map((label, index) => (
                <View key={`${label}-${index}`} style={styles.calendarDayLabel}>
                  <Text style={styles.calendarDayLabelText}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarMonthData.cells.map((day, index) => {
                if (!day) {
                  return (
                    <View key={`empty-${index}`} style={styles.calendarCellWrap}>
                      <View style={styles.calendarCellEmpty} />
                    </View>
                  );
                }

                const isSelected = day === selectedDay;

                return (
                  <View key={`day-${day}`} style={styles.calendarCellWrap}>
                    <Pressable
                      onPress={() => handleSelectTargetDate(day)}
                      style={({ pressed }) => [
                        styles.calendarCell,
                        isSelected && styles.calendarCellSelected,
                        { transform: [{ scale: pressed ? 0.94 : 1 }] },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          isSelected && styles.calendarCellTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.calendarActions}>
              <Pressable
                onPress={handleClearTargetDate}
                style={({ pressed }) => [
                  styles.calendarActionSecondary,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.calendarActionSecondaryText}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowDatePicker(false)}
                style={({ pressed }) => [
                  styles.calendarActionPrimary,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.calendarActionPrimaryText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: Spacing.md,
  },
  premiumBannerWrap: {
    marginBottom: Spacing.md,
  },
  label: {
    ...CommonStyles.sectionLabel,
  },
  labelSpaced: {
    ...CommonStyles.sectionLabelSpaced,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    ...CommonStyles.inputWrapper,
  },
  inputIcon: {
    ...CommonStyles.inputIcon,
  },
  input: {
    ...CommonStyles.input,
  },
  charCount: {
    ...CommonStyles.charCount,
  },
  textAreaWrapper: {
    ...CommonStyles.textAreaWrapper,
  },
  textAreaIcon: {
    ...CommonStyles.textAreaIcon,
  },
  textArea: {
    ...CommonStyles.textArea,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipScrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
    borderWidth: 1,
    borderColor: Colors.WarmSand,
  },
  categoryChipActive: {
    backgroundColor: Colors.SoftSky,
    borderColor: Colors.SteelBlue,
  },
  categoryChipLabel: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  categoryChipLabelActive: {
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  goalTypeColumn: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  goalTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Shapes.Input,
    backgroundColor: Colors.Surface,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
  },
  goalTypeOptionActive: {
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SteelBlue + '10',
  },
  goalTypeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.DustyTaupe,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTypeRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.SteelBlue,
  },
  goalTypeLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  goalTypeLabelActive: {
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  goalTypeDesc: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  targetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  targetField: {
    flex: 1,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 52,
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  datePickerButtonActive: {
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SoftSky,
  },
  dateText: {
    flex: 1,
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },
  dateTextPlaceholder: {
    color: Colors.DustyTaupe,
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  clearDateText: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.Surface,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  milestoneNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.SteelBlue + '18',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  milestoneNumberText: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    fontWeight: '700',
  },
  milestoneText: {
    flex: 1,
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  removeMilestoneBtn: {
    padding: Spacing.xs,
  },
  addMilestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addMilestoneInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
  },
  addMilestoneIcon: {
    marginRight: Spacing.sm,
  },
  addMilestoneInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  addMilestoneBtn: {
    width: 40,
    height: 40,
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.WarmSand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneHint: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ctaContainer: {
    ...CommonStyles.ctaContainer,
    paddingVertical: Spacing.md,
  },
  ctaButton: {
    borderRadius: Shapes.Button,
    overflow: 'hidden',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ctaGradientDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    ...Typography.Body1,
    fontWeight: '700',
    color: Colors.Surface,
    letterSpacing: 0.4,
  },
  ctaTextDisabled: {
    color: Colors.Surface,
    opacity: 0.7,
  },
  calendarModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    backgroundColor: Colors.OverlayLight,
  },
  calendarModalCard: {
    borderRadius: Shapes.Dialog,
    backgroundColor: Colors.Surface,
    padding: Spacing.md,
    ...Shadows.Modal,
  },
  calendarModalHeader: {
    marginBottom: Spacing.md,
  },
  calendarModalEyebrow: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginBottom: Spacing.xs,
  },
  calendarModalTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calendarHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.Background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.BorderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  calendarDays: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  calendarDayLabel: {
    width: '14.2857%',
    alignItems: 'center',
  },
  calendarDayLabelText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs / 2,
  },
  calendarCellWrap: {
    width: '14.2857%',
    paddingHorizontal: Spacing.xs / 2,
    marginBottom: Spacing.xs,
  },
  calendarCell: {
    height: 40,
    borderRadius: Shapes.Input,
    backgroundColor: Colors.Background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.BorderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCellEmpty: {
    height: 40,
  },
  calendarCellSelected: {
    backgroundColor: Colors.SteelBlue,
    borderColor: Colors.SteelBlue,
  },
  calendarCellText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  calendarCellTextSelected: {
    color: Colors.Surface,
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  calendarActionSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: Shapes.Button,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.Background,
  },
  calendarActionPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: Shapes.Button,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.WarmSand,
  },
  calendarActionSecondaryText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  calendarActionPrimaryText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
});
