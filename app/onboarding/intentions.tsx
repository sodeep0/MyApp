import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Animation } from '../../constants/theme';
import { Button } from '../../components/Button';
import { saveSelectedIntentions } from '../../stores/userStore';
import type { Intention } from '../../types/models';

const CATEGORIES: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'BUILD_HABITS', label: 'Habits', icon: 'timer' },
  { key: 'BREAK_HABITS', label: 'Addictions', icon: 'close-circle-outline' },
  { key: 'JOURNALING', label: 'Journal', icon: 'document-text-outline' },
  { key: 'GOALS', label: 'Goals', icon: 'flag-outline' },
  { key: 'SCREEN_TIME', label: 'Screen Time', icon: 'phone-portrait-outline' },
];

export default function IntentionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const anims = useRef(
    CATEGORIES.map(() => ({
      fade: new Animated.Value(0),
      scale: new Animated.Value(0.9),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.fade, {
          toValue: 1,
          duration: Animation.screenTransition,
          delay: 100 + i * 80,
          useNativeDriver: true,
        }),
        Animated.timing(a.scale, {
          toValue: 1,
          duration: Animation.screenTransition,
          delay: 100 + i * 80,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(60, animations).start();
  }, [anims]);

  const toggleCategory = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  };

  const handleContinue = async () => {
    const intentions = selected as Intention[];
    await saveSelectedIntentions(intentions);
    router.push('/onboarding/permissions' as any);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Text style={styles.title}>What do you want to own?</Text>
        <Text style={styles.subtitle}>Select one or more to personalize your experience</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + Spacing.xxl + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map((item, i) => {
          const isSelected = selected.includes(item.key);
          return (
            <Animated.View
              key={item.key}
              style={[
                {
                  opacity: anims[i].fade,
                  transform: [{ scale: anims[i].scale }],
                },
              ]}
            >
              <Pressable
                onPress={() => toggleCategory(item.key)}
                style={[
                  styles.chip,
                  isSelected && styles.chipSelected,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={Colors.SteelBlue}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && styles.chipLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        {selected.length > 0 && (
          <Text style={styles.selectedCount}>{selected.length} selected</Text>
        )}
        <Button
          label="Continue"
          onPress={handleContinue}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    paddingHorizontal: Spacing.screenH,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.Display,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Shapes.Chip,
    borderWidth: 1.5,
    borderColor: Colors.WarmSand,
    backgroundColor: Colors.WarmSand,
  },
  chipSelected: {
    backgroundColor: Colors.SoftSky,
    borderColor: Colors.SoftSky,
  },
  chipLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: Colors.TextPrimary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.screenH,
    right: Spacing.screenH,
    gap: Spacing.xs,
    backgroundColor: Colors.Background,
    paddingTop: Spacing.md,
  },
  selectedCount: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    textAlign: 'center',
  },
});