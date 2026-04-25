import { Colors, Shapes, Shadows, Spacing, Typography } from '@/constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingStateProps {
  title?: string;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  title = 'Loading',
  message = 'Pulling your latest Kaarma data into view.',
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.card}>
        <View style={styles.spinnerWrap}>
          <ActivityIndicator size="small" color={Colors.SteelBlue} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    ...Shadows.Card,
  },
  spinnerWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.SteelBlue + '12',
  },
  title: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  message: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
  },
});

export default LoadingState;
