// Permission Gate — prompts user to grant Usage Stats permission on Android
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes } from '@/constants/theme';
import { hasScreenTimePermission, requestScreenTimePermission } from '@/services/screenTimeService';

interface PermissionGateProps {
  onPermissionGranted: () => void;
}

export default function PermissionGate({ onPermissionGranted }: PermissionGateProps) {
  const [requesting, setRequesting] = React.useState(false);
  const retryTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      mounted.current = false;
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
    };
  }, []);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await requestScreenTimePermission();
      const granted = await hasScreenTimePermission();
      if (granted) {
        onPermissionGranted();
        return;
      }
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
      retryTimer.current = setTimeout(async () => {
        const rechecked = await hasScreenTimePermission();
        if (mounted.current && rechecked) onPermissionGranted();
        retryTimer.current = null;
      }, 2000);
    } finally {
      if (mounted.current) {
        setRequesting(false);
      }
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Ionicons name="phone-portrait-outline" size={64} color={Colors.DustyTaupe} />
        <Text style={styles.title}>Screen Time Unavailable</Text>
        <Text style={styles.description}>
          Screen time tracking requires an Android device with usage stats access.
          You can still explore the screen time UI with sample data.
        </Text>
        <Pressable style={styles.fallbackBtn} onPress={onPermissionGranted}>
          <Text style={styles.fallbackText}>View sample data</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconBg}>
        <Ionicons name="analytics-outline" size={48} color={Colors.SteelBlue} />
      </View>
      <Text style={styles.title}>Enable Screen Time Access</Text>
      <Text style={styles.description}>
        To track your screen time, Kaarma needs access to your app usage data.
        This is stored locally and never shared.
      </Text>

      <View style={styles.steps}>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Tap &quot;Enable Access&quot; below</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>Toggle &quot;Allow access&quot; for Kaarma</Text>
        </View>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>Come back — your data loads automatically</Text>
        </View>
      </View>

      <Pressable
        style={[styles.ctaButton, requesting && styles.ctaButtonDisabled]}
        onPress={handleEnable}
        disabled={requesting}
      >
        <Ionicons name={requesting ? 'hourglass-outline' : 'lock-open-outline'} size={18} color={Colors.Surface} />
        <Text style={styles.ctaText}>{requesting ? 'Opening Settings…' : 'Enable Access'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.SteelBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  steps: {
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.SteelBlue + '20',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    ...Typography.Body1,
    color: Colors.SteelBlue,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    flex: 1,
    fontWeight: '500',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Shapes.Button,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    ...Typography.Body1,
    color: Colors.Surface,
    fontWeight: '600',
  },
  fallbackBtn: {
    backgroundColor: Colors.SteelBlue + '30',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Shapes.Button,
  },
  fallbackText: {
    ...Typography.Body1,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
});
