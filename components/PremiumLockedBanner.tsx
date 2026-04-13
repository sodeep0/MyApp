import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '../constants/theme';

interface PremiumLockedBannerProps {
  featureName?: string;
  onUpgrade: () => void;
}

export function PremiumLockedBanner({
  featureName = 'this feature',
  onUpgrade,
}: PremiumLockedBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="lock-closed" size={20} color={Colors.SteelBlue} />
      </View>
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.description}>
        Unlock {featureName} and more with Kaarma Premium
      </Text>
      <Pressable
        onPress={onUpgrade}
        style={({ pressed }) => [
          styles.upgradeButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.upgradeText}>Upgrade Now</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.Surface} style={styles.arrowIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Card,
    borderColor: Colors.DustyTaupe,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.Card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.Surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Shapes.Button,
  },
  pressed: {
    opacity: 0.85,
  },
  upgradeText: {
    ...Typography.Body1,
    color: Colors.Surface,
    fontWeight: '600',
  },
  arrowIcon: {
    marginLeft: Spacing.xs,
  },
});

export default PremiumLockedBanner;