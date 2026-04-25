import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Animation } from '../../constants/theme';
import { Button } from '../../components/Button';
import { setOnboardingCompleted } from '../../stores/userStore';

const SLIDES = [
  {
    icon: 'timer-outline' as const,
    headline: 'Build Habits\nThat Stick',
    body: 'Track your daily habits, build streaks, and watch your consistency grow over time.',
    bg: Colors.Background,
    textDark: true,
  },
  {
    icon: 'shield-checkmark-outline' as const,
    headline: 'Break Free\nFrom Bad Habits',
    body: 'Private and discreet. Overcome addictions with powerful tracking and relapse prevention.',
    bg: Colors.TextPrimary,
    textDark: false,
  },
  {
    icon: 'flag-outline' as const,
    headline: 'Set Goals.\nCrush Them.',
    body: 'Define meaningful goals, track progress, and celebrate every milestone along the way.',
    bg: Colors.WarmSand,
    textDark: true,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnims = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = fadeAnims.map((a, i) =>
      Animated.timing(a, {
        toValue: 1,
        duration: Animation.screenTransition,
        delay: 100 + i * 120,
        useNativeDriver: true,
      })
    );
    Animated.stagger(60, animations).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slide = SLIDES[currentSlide];
  const isDark = !slide.textDark;

  const goToNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/onboarding/intentions' as any);
    }
  };

  const handleExistingAccount = async () => {
    await setOnboardingCompleted(true);
    router.replace('/auth/sign-in' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <View style={[styles.illustrationArea, { paddingTop: insets.top + Spacing.xxl }]}>
        <Animated.View
          style={[
            styles.illustrationContent,
            { opacity: fadeAnims[Math.min(currentSlide, fadeAnims.length - 1)] },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: isDark ? Colors.SteelBlue + '25' : Colors.SteelBlue + '18' }]}>
            <Ionicons name={slide.icon} size={56} color={isDark ? Colors.SoftSky : Colors.SteelBlue} />
          </View>
        </Animated.View>
      </View>

      <View style={[styles.textBlock, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Text style={[styles.headline, { color: isDark ? Colors.Surface : Colors.TextPrimary }]}>
          {slide.headline}
        </Text>
        <Text style={styles.body}>{slide.body}</Text>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentSlide
                  ? [styles.dotActive, { backgroundColor: isDark ? Colors.Surface : Colors.SteelBlue }]
                  : [styles.dotInactive, { backgroundColor: isDark ? Colors.Surface + '40' : Colors.DustyTaupe + '60' }],
              ]}
            />
          ))}
        </View>

        <Button
          label={currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={goToNext}
          fullWidth
        />
        <Pressable
          onPress={() => {
            void handleExistingAccount();
          }}
          style={styles.linkRow}
        >
          <Text style={[styles.linkText, { color: isDark ? Colors.SoftSky : Colors.TextSecondary }]}>
            I already have an account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustrationArea: {
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    paddingHorizontal: Spacing.screenH,
  },
  headline: {
    ...Typography.Headline1,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 6,
  },
  linkRow: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  linkText: {
    ...Typography.Body2,
  },
});
