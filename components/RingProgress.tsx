import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

interface RingProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  value?: string;
  color?: string;
  trackColor?: string;
  isCompleted?: boolean;
  light?: boolean;
}

export function RingProgress({
  progress,
  size = 140,
  strokeWidth = 10,
  label = '',
  value = '',
  color,
  trackColor = Colors.DustyTaupe,
  isCompleted = false,
  light = false,
}: RingProgressProps) {
  const fillColor = color || (isCompleted ? Colors.Success : Colors.Surface);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerContent}>
        {value && <Text style={[styles.value, light && styles.valueLight]}>{value}</Text>}
        {label && <Text style={[styles.label, light && styles.labelLight]}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TextPrimary,
    lineHeight: 20,
  },
  valueLight: {
    color: Colors.Surface,
  },
  label: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.TextSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelLight: {
    color: Colors.Surface + 'CC',
  },
});

export default RingProgress;