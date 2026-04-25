import { Colors, Shapes, Shadows, Spacing, Typography } from '@/constants/theme';
import { useNetworkState } from 'expo-network';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function isOffline(
  isConnected: boolean | null | undefined,
  isInternetReachable: boolean | null | undefined,
): boolean {
  return isConnected === false || isInternetReachable === false;
}

export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const networkState = useNetworkState();

  if (!isOffline(networkState.isConnected, networkState.isInternetReachable)) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + Spacing.sm }]}
    >
      <View style={styles.banner}>
        <Text style={styles.label}>Offline mode</Text>
        <Text style={styles.message}>
          Changes stay local and will sync once you&apos;re back online.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.screenH,
    right: Spacing.screenH,
    zIndex: 50,
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.Warning + '30',
    backgroundColor: Colors.Warning + '14',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.Card,
  },
  label: {
    ...Typography.Caption,
    color: Colors.Warning,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  message: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    marginTop: 2,
  },
});

export default OfflineBanner;
