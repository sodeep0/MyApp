import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shapes } from '../constants/theme';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
  trackColor?: string;
  variant?: 'default' | 'success' | 'danger';
}

export function ProgressBar({
  progress,
  color,
  height = 8,
  trackColor = Colors.WarmSand,
  variant = 'default',
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const fillColor = color || (
    variant === 'success' ? Colors.Success
      : variant === 'danger' ? Colors.Danger
        : Colors.SteelBlue
  );

  return (
    <View style={[styles.container, { height, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: fillColor,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Shapes.PillButton,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Shapes.PillButton,
  },
});

export default ProgressBar;