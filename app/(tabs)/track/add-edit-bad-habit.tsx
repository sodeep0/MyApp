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
import { PremiumLockedBanner } from '@/components/PremiumLockedBanner';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { CommonStyles } from '@/constants/commonStyles';
import { useCountLimitedFeatureGate } from '@/hooks/useFeatureGate';
import { safeBack } from '@/navigation/safeBack';
import { isCountLimitedFeatureLockedError } from '@/services/featureAccess';
import {
  addBadHabit,
  countActiveBadHabits,
  getBadHabitById,
  updateBadHabit,
} from '@/stores/badHabitStore';
import { BadHabitCategory, BadHabitSeverity } from '@/types/models';

const CATEGORIES = [
  { key: 'SUBSTANCE', label: 'Substance', icon: 'flask-outline' as const },
  { key: 'DIGITAL', label: 'Digital', icon: 'phone-portrait-outline' as const },
  { key: 'BEHAVIORAL', label: 'Behavioral', icon: 'repeat-outline' as const },
  { key: 'CUSTOM', label: 'Custom', icon: 'create-outline' as const },
];

const CATEGORY_COLORS: Record<string, string> = {
  SUBSTANCE: Colors.Warning,
  DIGITAL: Colors.SteelBlue,
  BEHAVIORAL: Colors.Success,
  CUSTOM: Colors.DustyTaupe,
};

const SEVERITIES = [
  { key: 'MILD', label: 'Mild', description: 'Occasional temptation', color: Colors.Success },
  { key: 'MODERATE', label: 'Moderate', description: 'Regular struggle', color: Colors.Warning },
  { key: 'SEVERE', label: 'Severe', description: 'Daily challenge', color: Colors.Danger },
];

export default function AddEditBadHabitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const badHabitGate = useCountLimitedFeatureGate('badHabits', countActiveBadHabits, {
    enabled: !isEditing,
  });

  const [name, setName] = useState('');
  const [category, setCategory] = useState<BadHabitCategory>(BadHabitCategory.BEHAVIORAL);
  const [severity, setSeverity] = useState<BadHabitSeverity>(BadHabitSeverity.MODERATE);
  const [quitDate, setQuitDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    const loadHabit = async () => {
      const habit = await getBadHabitById(id as string);
      if (habit) {
        setName(habit.name);
        setCategory(habit.category);
        setSeverity(habit.severity);
        setQuitDate(habit.quitDate);
        setNotes(habit.notes || '');
      }
      setIsLoading(false);
    };
    loadHabit();
  }, [id, isEditing]);

  const handleSave = async () => {
    if (isLoading || isSaving) return;

    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this habit.');
      return;
    }
    if (badHabitGate.locked) {
      router.push('/premium' as any);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateBadHabit(id as string, {
          name: name.trim(),
          category,
          severity,
          quitDate,
          notes: notes.trim() || null,
        });
      } else {
        await addBadHabit({
          userId: 'local',
          name: name.trim(),
          category,
          severity,
          quitDate,
          notes: notes.trim() || null,
        });
      }
      safeBack(router, '/(tabs)/track/bad-habits');
    } catch (error) {
      if (isCountLimitedFeatureLockedError(error)) {
        await badHabitGate.refresh();
        Alert.alert('Premium Required', error.message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/premium' as any) },
        ]);
        return;
      }

      console.error('Failed to save bad habit:', error);
      Alert.alert('Error', 'Failed to save bad habit. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = name.trim().length > 0 && !badHabitGate.locked;

  if (isLoading) {
    return (
      <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable onPress={() => safeBack(router, '/(tabs)/track/bad-habits')} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => safeBack(router, '/(tabs)/track/bad-habits')}
          style={({ pressed }) => [styles.headerBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Bad Habit' : 'Track a Bad Habit'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Empowering message for new habits */}
        {!isEditing && (
          <>
            <View style={styles.empoweringBanner}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.Success} />
              <Text style={styles.empoweringText}>
                You&apos;re taking a brave step. This stays private on this device.
              </Text>
            </View>
            {badHabitGate.locked && (
              <PremiumLockedBanner
                featureName={badHabitGate.featureName}
                onUpgrade={() => router.push('/premium' as any)}
              />
            )}
          </>
        )}

        {/* Name */}
        <Text style={styles.label}>HABIT NAME</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="close-circle-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="What habit are you quitting?"
            placeholderTextColor={Colors.DustyTaupe}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>
        <Text style={styles.charCount}>{name.length}/50</Text>

        {/* Category */}
        <Text style={[styles.label, styles.labelSpaced]}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.key;
            const catColor = CATEGORY_COLORS[cat.key] || Colors.DustyTaupe;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key as BadHabitCategory)}
                style={({ pressed }) => [
                  styles.categoryCard,
                  isActive && [styles.categoryCardActive, { borderColor: catColor }],
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                {isActive && <View style={[styles.categoryActiveGlow, { backgroundColor: catColor + '14' }]} />}
                {isActive && (
                  <View style={[styles.categorySelectedBadge, { backgroundColor: catColor + '20' }]}>
                    <Ionicons name="checkmark" size={12} color={catColor} />
                  </View>
                )}

                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.categoryIconWrap,
                      { backgroundColor: isActive ? catColor + '20' : catColor + '12' },
                    ]}
                  >
                    <Ionicons name={cat.icon} size={22} color={isActive ? catColor : Colors.TextSecondary} />
                  </View>
                  <Text style={[styles.categoryLabel, isActive && { color: catColor, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Severity */}
        <Text style={[styles.label, styles.labelSpaced]}>SEVERITY</Text>
        <View style={styles.severityColumn}>
          {SEVERITIES.map((sev) => {
            const isActive = severity === sev.key;
            return (
              <Pressable
                key={sev.key}
                onPress={() => setSeverity(sev.key as BadHabitSeverity)}
                style={({ pressed }) => [
                  styles.severityOption,
                  isActive && [styles.severityOptionActive, { borderColor: sev.color }],
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                {isActive && <View style={[styles.severityActiveGlow, { backgroundColor: sev.color + '12' }]} />}
                {isActive && (
                  <View style={[styles.severitySelectedBadge, { backgroundColor: sev.color + '20' }]}>
                    <Ionicons name="checkmark" size={12} color={sev.color} />
                  </View>
                )}

                <View style={styles.severityContentRow}>
                  <View style={[styles.severityRadio, isActive && { borderColor: sev.color }]}> 
                    {isActive && <View style={[styles.severityRadioDot, { backgroundColor: sev.color }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.severityLabel, isActive && { color: sev.color }]}> 
                      {sev.label}
                    </Text>
                    <Text style={styles.severityDesc}>{sev.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: isActive ? sev.color + '22' : Colors.WarmSand },
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityBadgeText,
                        { color: isActive ? sev.color : Colors.TextSecondary },
                      ]}
                    >
                      {sev.label}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Quit Date */}
        <Text style={[styles.label, styles.labelSpaced]}>QUIT DATE</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="calendar-outline" size={18} color={Colors.TextSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.DustyTaupe}
            value={quitDate}
            onChangeText={setQuitDate}
          />
        </View>
        <Text style={styles.hintText}>Day you committed to quitting this habit</Text>

        {/* Notes */}
        <Text style={[styles.label, styles.labelSpaced]}>NOTES (OPTIONAL)</Text>
        <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
          <Ionicons name="document-text-outline" size={18} color={Colors.TextSecondary} style={[styles.inputIcon, styles.textAreaIcon]} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional thoughts or motivation..."
            placeholderTextColor={Colors.DustyTaupe}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Privacy Banner */}
        <View style={styles.privacyBanner}>
          <Ionicons name="lock-closed" size={16} color={Colors.TextSecondary} />
          <Text style={styles.privacyText}>
            Your data is stored locally and never synced or shared. Local encryption is planned next.
          </Text>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* CTA */}
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
          <Ionicons name="checkmark-circle" size={20} color={Colors.Surface} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
            {isEditing ? 'Save Changes' : 'Start Tracking'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  headerBtn: {
    ...CommonStyles.stackHeaderButton,
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  scrollContent: {
    ...CommonStyles.formScrollContent,
    paddingTop: Spacing.md,
  },
  empoweringBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.Success + '10',
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.Success + '30',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  empoweringText: {
    ...Typography.Body2,
    color: Colors.Success,
    flex: 1,
    lineHeight: 20,
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
  inputIcon: {
    ...CommonStyles.inputIcon,
  },
  input: {
    ...CommonStyles.input,
  },
  charCount: {
    ...CommonStyles.charCount,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    gap: Spacing.xs,
    ...Shadows.Card,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryCardActive: {
    borderWidth: 2,
    shadowColor: Colors.TextPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryActiveGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    zIndex: 1,
  },
  categorySelectedBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  severityColumn: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  severityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    ...Shadows.Card,
    overflow: 'hidden',
    position: 'relative',
  },
  severityOptionActive: {
    backgroundColor: Colors.Surface,
    borderWidth: 2,
    shadowColor: Colors.TextPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  severityActiveGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  severitySelectedBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  severityContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    zIndex: 1,
  },
  severityRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.DustyTaupe,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  severityDesc: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.PillButton,
  },
  severityBadgeText: {
    ...Typography.Micro,
    fontWeight: '600',
  },
  hintText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
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
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.WarmSand + '60',
    borderRadius: Shapes.Chip,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  privacyText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    flex: 1,
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
