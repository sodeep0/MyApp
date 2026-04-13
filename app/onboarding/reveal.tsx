import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Animation } from '../../constants/theme';
import { Button } from '../../components/Button';
import { setOnboardingCompleted } from '../../stores/userStore';

export default function RevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideUpAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Animation.streakAppear,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: Animation.streakAppear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideUpAnim]);

  const handleStart = async () => {
    await setOnboardingCompleted(true);
    router.replace('/(tabs)' as any);
  };

  const FEATURES = [
    { label: 'Habits', icon: 'time' as const },
    { label: 'Addictions', icon: 'close-circle-outline' as const },
    { label: 'Journal', icon: 'document-text-outline' as const },
    { label: 'Goals', icon: 'flag-outline' as const },
    { label: 'Screen Time', icon: 'phone-portrait-outline' as const },
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            paddingTop: insets.top + Spacing.xxl,
          },
        ]}
      >
        <View style={styles.iconBg}>
          <Ionicons name="sparkles-outline" size={40} color={Colors.SteelBlue} />
        </View>

        <Text style={styles.title}>{"You're All Set!"}</Text>
        <Text style={styles.description}>
          Ready to transform your habits, track your screen time, and achieve your goals.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((item) => (
            <View key={item.label} style={styles.featurePill}>
              <Ionicons name={item.icon} size={16} color={Colors.SteelBlue} />
              <Text style={styles.featureText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          {
            transform: [{ translateY: slideUpAnim }],
            opacity: fadeAnim,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        <Button
          label="Open Dashboard"
          onPress={handleStart}
          fullWidth
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenH,
  },
  content: {
    alignItems: 'center',
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.SteelBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.Display,
    color: Colors.TextPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  description: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Chip,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  featureText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    fontWeight: '500',
  },
  footer: {
    paddingTop: Spacing.md,
  },
});