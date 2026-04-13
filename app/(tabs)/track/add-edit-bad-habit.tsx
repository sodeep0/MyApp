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
import { addBadHabit, updateBadHabit, getBadHabitById } from '@/stores/badHabitStore';
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
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for this habit.');
      return;
    }

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
    router.back();
  };

  const canSave = name.trim().length > 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Empowering message for new habits */}
        {!isEditing && (
          <View style={styles.empoweringBanner}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.Success} />
            <Text style={styles.empoweringText}>
              You&apos;re taking a brave step. This stays private, always.
            </Text>
          </View>
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
                  isActive && { borderColor: catColor, backgroundColor: catColor + '10' },
                  { transform: [{ scale: pressed ? 0.96 : 1 }] },
                ]}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: catColor + '18' }]}>
                  <Ionicons name={cat.icon} size={22} color={isActive ? catColor : Colors.TextSecondary} />
                </View>
                <Text style={[styles.categoryLabel, isActive && { color: catColor, fontWeight: '600' }]}>
                  {cat.label}
                </Text>
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
                  isActive && styles.severityOptionActive,
                  isActive && { borderColor: sev.color },
                  { transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <View style={styles.severityRadio}>
                  {isActive && <View style={[styles.severityRadioDot, { backgroundColor: sev.color }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.severityLabel, isActive && { color: sev.color }]}>
                    {sev.label}
                  </Text>
                  <Text style={styles.severityDesc}>{sev.description}</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: sev.color + '18' }]}>
                  <Text style={[styles.severityBadgeText, { color: sev.color }]}>{sev.label}</Text>
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
            Your data is stored locally and encrypted. It is never synced or shared.
          </Text>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + Spacing.md }]}>
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
            {isEditing ? 'Save Changes' : 'Start Tracking'}
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
    paddingTop: Spacing.lg,
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
  charCount: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    textAlign: 'right',
    marginTop: 4,
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
  },
  severityOptionActive: {
    backgroundColor: Colors.Surface,
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
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: Spacing.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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