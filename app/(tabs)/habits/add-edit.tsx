import { Button } from "@/components/Button";
import { CommonStyles } from "@/constants/commonStyles";
import { Colors, Shapes, Spacing, Typography } from "@/constants/theme";
import { safeBack } from "@/navigation/safeBack";
import { addHabit, getHabitById, updateHabit } from "@/stores/habitStore";
import { HabitCategory, HabitFrequency } from "@/types/models";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface IconOption {
  name: IoniconName;
  label: string;
  color: string;
  bg: string;
}

const ICON_OPTIONS: IconOption[] = [
  {
    name: "checkmark-circle",
    label: "Check",
    color: Colors.SteelBlue,
    bg: Colors.SteelBlue + "20",
  },
  {
    name: "fitness-outline",
    label: "Run",
    color: Colors.SoftSky,
    bg: Colors.SoftSky + "30",
  },
  {
    name: "book-outline",
    label: "Read",
    color: Colors.Success,
    bg: Colors.Success + "20",
  },
  {
    name: "leaf-outline",
    label: "Mind",
    color: Colors.SteelBlue,
    bg: Colors.SoftSky + "30",
  },
  {
    name: "laptop-outline",
    label: "Code",
    color: Colors.DustyTaupe,
    bg: Colors.WarmSand,
  },
  {
    name: "water-outline",
    label: "Water",
    color: Colors.SteelBlue,
    bg: Colors.SteelBlue + "20",
  },
  {
    name: "bicycle-outline",
    label: "Bike",
    color: Colors.Success,
    bg: Colors.Success + "20",
  },
  {
    name: "musical-notes-outline",
    label: "Music",
    color: Colors.DustyTaupe,
    bg: Colors.WarmSand,
  },
];

const CATEGORIES = ["Health", "Mind", "Work", "Personal", "Custom"];
const FREQUENCIES = ["Daily", "Weekly", "Custom"];
const TIME_OF_DAY = ["Morning", "Afternoon", "Evening", "Anytime"];

function toHabitCategory(cat: string): HabitCategory {
  const map: Record<string, HabitCategory> = {
    Health: HabitCategory.HEALTH,
    Mind: HabitCategory.MIND,
    Work: HabitCategory.WORK,
    Personal: HabitCategory.PERSONAL,
    Custom: HabitCategory.CUSTOM,
  };
  return map[cat] ?? HabitCategory.CUSTOM;
}

function fromHabitCategory(cat: HabitCategory): string {
  const map: Record<HabitCategory, string> = {
    [HabitCategory.HEALTH]: "Health",
    [HabitCategory.MIND]: "Mind",
    [HabitCategory.WORK]: "Work",
    [HabitCategory.PERSONAL]: "Personal",
    [HabitCategory.CUSTOM]: "Custom",
  };
  return map[cat] ?? "Custom";
}

function toHabitFrequency(freq: string): HabitFrequency {
  const map: Record<string, HabitFrequency> = {
    Daily: HabitFrequency.DAILY,
    Weekly: HabitFrequency.WEEKLY,
    Custom: HabitFrequency.X_PER_WEEK,
  };
  return map[freq] ?? HabitFrequency.DAILY;
}

function fromHabitFrequency(freq: HabitFrequency): string {
  const map: Record<HabitFrequency, string> = {
    [HabitFrequency.DAILY]: "Daily",
    [HabitFrequency.WEEKLY]: "Weekly",
    [HabitFrequency.X_PER_WEEK]: "Custom",
    [HabitFrequency.EVERY_N_DAYS]: "Custom",
  };
  return map[freq] ?? "Daily";
}

export default function AddEditHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const isEditing = !!id;

  const [name, setName] = useState("");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [category, setCategory] = useState("Health");
  const [frequency, setFrequency] = useState("Daily");
  const [timeOfDay, setTimeOfDay] = useState("Anytime");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [timesPerWeek, setTimesPerWeek] = useState("3");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing || !id) return;

    async function loadHabit() {
      try {
        const habit = await getHabitById(id as string);
        if (habit) {
          setName(habit.name);
          setCategory(fromHabitCategory(habit.category));
          setFrequency(fromHabitFrequency(habit.frequency));
          if (habit.reminderTime) {
            setReminderEnabled(true);
            setReminderTime(habit.reminderTime);
            if (habit.reminderTime < "12:00") {
              setTimeOfDay("Morning");
            } else {
              setTimeOfDay("Evening");
            }
          }
          if (habit.timesPerWeek) {
            setTimesPerWeek(String(habit.timesPerWeek));
          }
          const iconIdx = ICON_OPTIONS.findIndex(
            (icon) => icon.label === habit.emoji,
          );
          if (iconIdx !== -1) setSelectedIconIndex(iconIdx);
        }
      } catch (error) {
        console.error("Failed to load habit:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHabit();
  }, [id, isEditing]);

  const handleSave = async () => {
    if (!name.trim() || isSaving || isLoading) return;

    setIsSaving(true);

    const selectedIcon = ICON_OPTIONS[selectedIconIndex];

    let finalReminderTime: string | null = null;
    if (reminderEnabled) {
      finalReminderTime = reminderTime;
    } else if (timeOfDay === "Morning") {
      finalReminderTime = "08:00";
    } else if (timeOfDay === "Afternoon") {
      finalReminderTime = "13:00";
    } else if (timeOfDay === "Evening") {
      finalReminderTime = "20:00";
    }

    try {
      if (isEditing && id) {
        await updateHabit(id as string, {
          name: name.trim(),
          emoji: selectedIcon.label,
          colorHex: selectedIcon.color,
          category: toHabitCategory(category),
          frequency: toHabitFrequency(frequency),
          weekDays: [],
          timesPerWeek:
            frequency === "Custom" ? parseInt(timesPerWeek) || 3 : 1,
          everyNDays: 1,
          reminderTime: finalReminderTime,
        });
      } else {
        await addHabit({
          userId: "local",
          name: name.trim(),
          emoji: selectedIcon.label,
          colorHex: selectedIcon.color,
          category: toHabitCategory(category),
          frequency: toHabitFrequency(frequency),
          weekDays: [],
          timesPerWeek:
            frequency === "Custom" ? parseInt(timesPerWeek) || 3 : 1,
          everyNDays: 1,
          reminderTime: finalReminderTime,
        });
      }

      safeBack(router, "/(tabs)/habits");
    } catch (error) {
      console.error("Failed to save habit:", error);
      Alert.alert("Error", "Failed to save habit. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top || Spacing.lg }]}>
        <Pressable
          onPress={() => safeBack(router, "/(tabs)/habits")}
          style={styles.backBtn}
        >
          <Ionicons name="close" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Habit" : "New Habit"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={Colors.TextSecondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter habit name"
            placeholderTextColor={Colors.DustyTaupe}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>
        <Text style={styles.charCount}>{name.length}/50</Text>

        <Text style={styles.sectionTitle}>Icon</Text>
        <View style={styles.iconRow}>
          {ICON_OPTIONS.map((icon, index) => (
            <Pressable
              key={icon.name}
              onPress={() => setSelectedIconIndex(index)}
              style={[
                styles.iconOption,
                {
                  backgroundColor:
                    selectedIconIndex === index ? icon.bg : Colors.Surface,
                },
                selectedIconIndex === index && styles.iconOptionSelected,
              ]}
            >
              <Ionicons
                name={icon.name}
                size={22}
                color={
                  selectedIconIndex === index
                    ? icon.color
                    : Colors.TextSecondary
                }
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, category === cat && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  category === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Frequency</Text>
        <View style={styles.chipRow}>
          {FREQUENCIES.map((freq) => (
            <Pressable
              key={freq}
              onPress={() => setFrequency(freq)}
              style={[styles.chip, frequency === freq && styles.chipActive]}
            >
              <Text
                style={[
                  styles.chipText,
                  frequency === freq && styles.chipTextActive,
                ]}
              >
                {freq}
              </Text>
            </Pressable>
          ))}
        </View>

        {frequency === "Custom" && (
          <View style={styles.customFrequencyRow}>
            <Text style={styles.customFrequencyLabel}>Times per week</Text>
            <View style={styles.customFrequencyInput}>
              <Pressable
                onPress={() => {
                  const val = Math.max(1, parseInt(timesPerWeek) - 1);
                  setTimesPerWeek(String(val));
                }}
                style={styles.customFrequencyBtn}
              >
                <Ionicons name="remove" size={18} color={Colors.TextPrimary} />
              </Pressable>
              <Text style={styles.customFrequencyValue}>{timesPerWeek}</Text>
              <Pressable
                onPress={() => {
                  const val = Math.min(7, parseInt(timesPerWeek) + 1);
                  setTimesPerWeek(String(val));
                }}
                style={styles.customFrequencyBtn}
              >
                <Ionicons name="add" size={18} color={Colors.TextPrimary} />
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Time of Day</Text>
        <View style={styles.chipRow}>
          {TIME_OF_DAY.map((tod) => (
            <Pressable
              key={tod}
              onPress={() => setTimeOfDay(tod)}
              style={[styles.chip, timeOfDay === tod && styles.chipActive]}
            >
              <Ionicons
                name={
                  tod === "Morning"
                    ? "sunny-outline"
                    : tod === "Afternoon"
                      ? "partly-sunny-outline"
                      : tod === "Evening"
                        ? "moon-outline"
                        : "time-outline"
                }
                size={14}
                color={
                  timeOfDay === tod ? Colors.Surface : Colors.TextSecondary
                }
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  timeOfDay === tod && styles.chipTextActive,
                ]}
              >
                {tod}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setReminderEnabled(!reminderEnabled)}
          style={styles.reminderRow}
        >
          <View style={styles.reminderInfo}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={Colors.SteelBlue}
            />
            <View style={styles.reminderTextGroup}>
              <Text style={styles.reminderTitle}>Reminder</Text>
              <Text style={styles.reminderDesc}>
                {reminderEnabled ? reminderTime : "Get a push notification"}
              </Text>
            </View>
          </View>
          <View style={[styles.toggle, reminderEnabled && styles.toggleOn]}>
            <View
              style={[
                styles.toggleKnob,
                reminderEnabled && styles.toggleKnobOn,
              ]}
            />
          </View>
        </Pressable>

        {reminderEnabled && (
          <View style={styles.reminderTimeRow}>
            <Ionicons name="time-outline" size={20} color={Colors.SteelBlue} />
            <TextInput
              style={styles.timeInput}
              value={reminderTime}
              onChangeText={setReminderTime}
              keyboardType="numbers-and-punctuation"
              placeholder="08:00"
              placeholderTextColor={Colors.TextMuted}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={[
          styles.ctaContainer,
          { paddingBottom: insets.bottom + Spacing.md + 70 },
        ]}
      >
        <Button
          label={isEditing ? "Save Changes" : "Create Habit"}
          onPress={handleSave}
          fullWidth
          disabled={isLoading || isSaving || !name.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.md,
  },
  sectionTitle: {
    ...CommonStyles.sectionLabel,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
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
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.Surface,
    borderWidth: 1.5,
    borderColor: Colors.BorderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  iconOptionSelected: {
    borderColor: Colors.SteelBlue,
    borderWidth: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    minWidth: 74,
    justifyContent: "center",
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Shapes.Chip,
    backgroundColor: Colors.WarmSand,
  },
  chipActive: {
    backgroundColor: Colors.SoftSky,
  },
  chipText: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
    fontWeight: "600",
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  chipTextActive: {
    color: Colors.TextPrimary,
    fontWeight: "700",
  },
  chipIcon: {
    marginRight: 4,
  },
  customFrequencyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.BorderSubtle,
  },
  customFrequencyLabel: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
  },
  customFrequencyInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  customFrequencyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.WarmSand,
    justifyContent: "center",
    alignItems: "center",
  },
  customFrequencyValue: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    minWidth: 24,
    textAlign: "center",
  },
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.BorderSubtle,
  },
  reminderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  reminderTextGroup: {
    flex: 1,
  },
  reminderTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "600",
  },
  reminderDesc: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.BorderSubtle,
    justifyContent: "center",
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.SteelBlue,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.Surface,
  },
  toggleKnobOn: {
    transform: [{ translateX: 20 }],
  },
  reminderTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.SteelBlue + "40",
  },
  timeInput: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    flex: 1,
  },
  ctaContainer: {
    ...CommonStyles.ctaContainer,
    paddingTop: Spacing.md,
  },
});
