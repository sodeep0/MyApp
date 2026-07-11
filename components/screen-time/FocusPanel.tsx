import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumLockedBanner } from '@/components/PremiumLockedBanner';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';

const FOCUS_DURATIONS = [
  { label: '25', unit: 'min', minutes: 25 },
  { label: '45', unit: 'min', minutes: 45 },
  { label: '60', unit: 'min', minutes: 60 },
];

const PRIMARY_CONTAINER = '#5d6d99' as const;

type FocusPanelProps = {
  locked: boolean;
  showPremiumBanner?: boolean;
  premiumFeatureName?: string;
  onStartFocus: (durationMinutes: number) => void;
  onPremiumUpgrade: () => void;
};

export function FocusPanel({
  locked,
  showPremiumBanner = false,
  premiumFeatureName = 'Focus sessions',
  onStartFocus,
  onPremiumUpgrade,
}: FocusPanelProps) {
  return (
    <LinearGradient
      colors={[PRIMARY_CONTAINER, Colors.SteelBlue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.focusCard}
    >
      {showPremiumBanner ? (
        <View style={styles.focusBannerWrap}>
          <PremiumLockedBanner
            featureName={premiumFeatureName}
            onUpgrade={onPremiumUpgrade}
          />
        </View>
      ) : null}
      <View style={styles.focusContent}>
        <View style={styles.focusHeader}>
          <Ionicons name="cellular" size={24} color={Colors.SoftSky} />
          <Text style={styles.focusTitle}>Set Focus Session</Text>
        </View>
        <Text style={styles.focusDescription}>
          Plan a focused stretch with a timer. Selected apps are saved as
          intentions; Kaarma does not block them yet.
        </Text>
        <View style={styles.focusButtonsRow}>
          {FOCUS_DURATIONS.map((duration) => (
            <Pressable
              key={duration.label}
              style={({ pressed }) => [
                styles.focusBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={
                locked
                  ? onPremiumUpgrade
                  : () => onStartFocus(duration.minutes)
              }
            >
              <Text style={styles.focusBtnLabel}>{duration.label}</Text>
              <Text style={styles.focusBtnUnit}>{duration.unit}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.decoCircle} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  focusCard: {
    borderRadius: Shapes.HeroCard,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  focusBannerWrap: {
    marginBottom: Spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  focusContent: { position: 'relative', zIndex: 1 },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.xs,
  },
  focusTitle: { ...Typography.Headline2, color: Colors.Surface },
  focusDescription: {
    ...Typography.Body2,
    color: Colors.Surface + 'CC',
    marginBottom: Spacing.lg,
    maxWidth: 260,
  },
  focusButtonsRow: { flexDirection: 'row', gap: Spacing.sm },
  focusBtn: {
    flex: 1,
    backgroundColor: Colors.Surface + '25',
    borderRadius: 16,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  focusBtnLabel: {
    ...Typography.Headline2,
    color: Colors.Surface,
    fontWeight: '700',
  },
  focusBtnUnit: {
    ...Typography.Micro,
    color: Colors.Surface + '99',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  decoCircle: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: Colors.WarmSand,
    opacity: 0.08,
    right: -48,
    top: -48,
  },
});
