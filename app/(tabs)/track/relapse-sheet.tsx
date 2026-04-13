import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { logUrgeEvent } from '@/stores/badHabitStore';
import type { UrgeEventType } from '@/types/models';

const TRIGGER_OPTIONS = [
  'Stress', 'Boredom', 'Social', 'Anxiety',
  'Loneliness', 'Anger', 'Tiredness', 'Hunger',
];

const TRIGGER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Stress': 'thunderstorm-outline',
  'Boredom': 'bed-outline',
  'Social': 'people-outline',
  'Anxiety': 'alert-circle-outline',
  'Loneliness': 'heart-dislike-outline',
  'Anger': 'flame-outline',
  'Tiredness': 'moon-outline',
  'Hunger': 'restaurant-outline',
};

interface RelapseSheetProps {
  visible: boolean;
  onClose: () => void;
  badHabitId: string;
  onLogged: () => void;
}

export default function RelapseSheet({ visible, onClose, badHabitId, onLogged }: RelapseSheetProps) {
  const [note, setNote] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [resetCounter, setResetCounter] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger],
    );
  };

  const addCustomTrigger = () => {
    const trimmed = customTrigger.trim();
    if (trimmed && !selectedTriggers.includes(trimmed)) {
      setSelectedTriggers([...selectedTriggers, trimmed]);
      setCustomTrigger('');
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const triggerTag = selectedTriggers.length > 0 ? selectedTriggers.join(', ') : null;
      await logUrgeEvent({
        badHabitId,
        type: 'RELAPSE' as UrgeEventType,
        note: note.trim() || null,
        triggerTag,
        resetCounter,
      });
      setNote('');
      setSelectedTriggers([]);
      setCustomTrigger('');
      setResetCounter(true);
      onLogged();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not log relapse. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View style={styles.sheetIconWrap}>
                <Ionicons name="flag-outline" size={20} color={Colors.Danger} />
              </View>
              <Text style={styles.sheetTitle}>Log Relapse</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={16}>
              <Ionicons name="close" size={24} color={Colors.TextPrimary} />
            </Pressable>
          </View>

          <Text style={styles.sheetSubtitle}>
            It happens. What matters is that you&apos;re tracking it. Stay strong.
          </Text>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>WHAT HAPPENED? (OPTIONAL)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.noteInput}
                placeholder="Describe what happened..."
                placeholderTextColor={Colors.DustyTaupe}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <Text style={[styles.label, styles.labelSpaced]}>TRIGGER TAGS</Text>
            <View style={styles.triggerGrid}>
              {TRIGGER_OPTIONS.map((trigger) => {
                const isSelected = selectedTriggers.includes(trigger);
                const icon = TRIGGER_ICONS[trigger] || 'help-outline';
                return (
                  <Pressable
                    key={trigger}
                    onPress={() => toggleTrigger(trigger)}
                    style={({ pressed }) => [
                      styles.triggerChip,
                      isSelected && styles.triggerChipSelected,
                      { transform: [{ scale: pressed ? 0.94 : 1 }] },
                    ]}
                  >
                    <Ionicons
                      name={icon}
                      size={14}
                      color={isSelected ? Colors.Danger : Colors.TextSecondary}
                    />
                    <Text style={[styles.triggerChipText, isSelected && styles.triggerChipTextSelected]}>
                      {trigger}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.customTriggerRow}>
              <View style={styles.customTriggerInputWrapper}>
                <TextInput
                  style={styles.customTriggerInput}
                  placeholder="Add custom trigger..."
                  placeholderTextColor={Colors.DustyTaupe}
                  value={customTrigger}
                  onChangeText={setCustomTrigger}
                  onSubmitEditing={addCustomTrigger}
                  returnKeyType="done"
                />
              </View>
              <Pressable
                onPress={addCustomTrigger}
                style={({ pressed }) => [styles.addTriggerBtn, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
              >
                <Ionicons name="add" size={20} color={Colors.SteelBlue} />
              </Pressable>
            </View>

            {selectedTriggers.length > 0 && (
              <View style={styles.selectedTriggersRow}>
                {selectedTriggers.map((tag) => (
                  <View key={tag} style={styles.selectedTrigger}>
                    <Text style={styles.selectedTriggerText}>{tag}</Text>
                    <Pressable onPress={() => toggleTrigger(tag)} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color={Colors.TextSecondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => setResetCounter(!resetCounter)}
              style={styles.toggleRow}
            >
              <View style={[styles.toggleBox, resetCounter && styles.toggleBoxActive]}>
                {resetCounter && <Ionicons name="checkmark" size={14} color={Colors.Surface} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Reset days clean counter</Text>
                <Text style={styles.toggleDesc}>Start counting from today again</Text>
              </View>
            </Pressable>
          </ScrollView>

          <View style={styles.sheetCTA}>
            <Pressable
              onPress={handleSubmit}
              disabled={saving}
              style={({ pressed }) => [styles.submitButton, { transform: [{ scale: pressed && !saving ? 0.98 : 1 }] }]}
            >
              <Ionicons name="flag-outline" size={20} color={Colors.Surface} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.submitText}>{saving ? 'Saving...' : 'Log Relapse'}</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.OverlayMedium,
  },
  sheet: {
    backgroundColor: Colors.Surface,
    borderTopLeftRadius: Shapes.BottomSheet,
    borderTopRightRadius: Shapes.BottomSheet,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.BorderSubtle,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.Danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
  },
  sheetSubtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    lineHeight: 20,
  },
  sheetContent: {
    padding: Spacing.md,
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
    backgroundColor: Colors.Background,
    borderWidth: 1,
    borderColor: Colors.DustyTaupe,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 52,
  },
  noteInput: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  triggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  triggerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },
  triggerChipSelected: {
    backgroundColor: Colors.SoftSky,
    borderColor: Colors.Danger,
  },
  triggerChipText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  triggerChipTextSelected: {
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  customTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  customTriggerInputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.DustyTaupe,
    borderRadius: Shapes.Input,
    backgroundColor: Colors.Background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  customTriggerInput: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  addTriggerBtn: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.WarmSand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTriggersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  selectedTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.Danger + '15',
    borderRadius: Shapes.Chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  selectedTriggerText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.DustyTaupe,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBoxActive: {
    backgroundColor: Colors.SteelBlue,
    borderColor: Colors.SteelBlue,
  },
  toggleLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  toggleDesc: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  sheetCTA: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
  },
  submitButton: {
    backgroundColor: Colors.Danger,
    borderRadius: Shapes.Button,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    height: 52,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.Surface,
    letterSpacing: 0.4,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
});