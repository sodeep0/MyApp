import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Shapes } from '@/constants/theme';
import { addGoal, updateGoal, getGoalById } from '@/stores/goalStore';
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(GoalCategory.FITNESS);
  const [goalType, setGoalType] = useState(GoalType.QUANTITATIVE);
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [metricName, setMetricName] = useState('');
  const [linkHabits, setLinkHabits] = useState(false);

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
        setLinkHabits(goal.linkedHabitIds.length > 0);
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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a goal title.');
      return;
    }
    if (goalType === GoalType.QUANTITATIVE && !targetValue.trim()) {
      Alert.alert('Missing Target', 'Please enter a target value for quantitative goals.');
      return;
    }

    const targetVal = goalType === GoalType.QUANTITATIVE ? parseFloat(targetValue) : null;

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
    router.back();
  };

  const canSave = title.trim() && (goalType !== 'QUANTITATIVE' || targetValue.trim());

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
            {isEditing ? 'Edit Goal' : 'New Goal'}
          </Text>
          <Text style={styles.headerSubtitle}>{getDateString()}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
        <Pressable style={styles.datePickerButton}>
          <Ionicons name="calendar-outline" size={18} color={Colors.TextSecondary} />
          <TextInput
            style={styles.dateTextInput}
            placeholder={targetDate || 'Choose a date (or leave empty)'}
            placeholderTextColor={Colors.DustyTaupe}
            value={targetDate}
            onChangeText={setTargetDate}
            onFocus={() => {}}
          />
        </Pressable>

        <View style={[styles.linkHabitsRow, styles.labelSpaced]}>
          <View style={styles.linkHabitsLeft}>
            <Ionicons name="link-outline" size={18} color={Colors.TextSecondary} />
            <View>
              <Text style={styles.linkHabitsTitle}>Link Habits</Text>
              <Text style={styles.linkHabitsDesc}>Connect goals to daily habits</Text>
            </View>
          </View>
          <Switch
            value={linkHabits}
            onValueChange={setLinkHabits}
            trackColor={{ false: Colors.BorderSubtle, true: Colors.SteelBlue + '80' }}
            thumbColor={linkHabits ? Colors.SteelBlue : Colors.Surface}
          />
        </View>

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

      <View style={styles.ctaContainer}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.ctaButton,
            !canSave && styles.ctaButtonDisabled,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          disabled={!canSave}
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
    paddingBottom: Spacing.md,
  },
  label: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
  },
  labelSpaced: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: Colors.Background,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
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
  charCount: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: Spacing.md,
  },
  textArea: {
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
  dateTextInput: {
    flex: 1,
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },
  linkHabitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    borderRadius: Shapes.Input,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  linkHabitsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  linkHabitsTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  linkHabitsDesc: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
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
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
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
});