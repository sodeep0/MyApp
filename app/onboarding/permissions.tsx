import {
  areNotificationsEnabledAsync,
  disableNotificationsAsync,
  enableNotificationsAsync,
} from '@/services/notifications';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '../../constants/theme';
import { Button } from '../../components/Button';

interface PermissionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onAllow: () => void;
  onSkip: () => void;
  granted?: boolean;
}

function PermissionCard({
  icon,
  title,
  description,
  onAllow,
  onSkip,
  granted = false,
}: PermissionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBg}>
          <Ionicons name={icon} size={22} color={Colors.SteelBlue} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {granted ? (
          <View style={styles.grantedRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.Success} />
            <Text style={styles.grantedText}>Done</Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable onPress={onSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Not now</Text>
            </Pressable>
            <Pressable onPress={onAllow} style={styles.allowBtn}>
              <Text style={styles.allowText}>Allow</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [statsGranted, setStatsGranted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadNotificationState = async () => {
      const enabled = await areNotificationsEnabledAsync();
      if (mounted) {
        setNotificationGranted(enabled);
      }
    };

    void loadNotificationState();

    return () => {
      mounted = false;
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      setNotificationGranted(true);
      return;
    }

    const enabled = await enableNotificationsAsync();
    setNotificationGranted(enabled);

    if (!enabled) {
      Alert.alert(
        'Notifications remain off',
        'You can enable them later from Settings whenever you want reminders and weekly reviews.',
      );
    }
  };

  const requestScreenTimePermission = async () => {
    // Screen time permission uses Android UsageStatsManager
    // This requires a native module or expo-dev-client build
    if (Platform.OS === 'android') {
      Alert.alert(
        'Enable Screen Time Access',
        'This will open Android Settings to grant Usage Access permission. Your data stays private.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // When native module is installed:
              // const granted = await openUsageSettings();
              // setStatsGranted(!!granted);
              setStatsGranted(true);
            },
          },
        ]
      );
    } else {
      // iOS doesn't allow app-level screen time access
      setStatsGranted(true);
    }
  };

  const handleDone = () => {
    router.push('/onboarding/reveal' as any);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark-outline" size={28} color={Colors.SteelBlue} />
        </View>
        <Text style={styles.title}>Let us help you better</Text>
        <Text style={styles.subtitle}>
          Granting these permissions unlocks features. You can change these anytime in settings.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl + 60 }}
        showsVerticalScrollIndicator={false}
      >
        <PermissionCard
          icon="notifications-outline"
          title="Notifications"
          description="Get habit reminders and streak alerts so you never miss a day."
          onAllow={requestNotificationPermission}
          onSkip={async () => {
            await disableNotificationsAsync();
            setNotificationGranted(true);
          }}
          granted={notificationGranted}
        />
        <PermissionCard
          icon="phone-portrait-outline"
          title="Screen Time Access"
          description="See which apps you use and for how long — and block them when your limit is reached."
          onAllow={requestScreenTimePermission}
          onSkip={() => setStatsGranted(true)}
          granted={statsGranted}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label="Continue"
          onPress={handleDone}
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
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.SteelBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.Card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.SteelBlue + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 17,
    marginBottom: 2,
  },
  cardDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    paddingTop: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skipBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  allowBtn: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.SteelBlue,
    borderRadius: Shapes.Button,
  },
  allowText: {
    ...Typography.Body2,
    color: Colors.Surface,
    fontWeight: '600',
  },
  grantedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  grantedText: {
    ...Typography.Caption,
    color: Colors.Success,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.screenH,
    right: Spacing.screenH,
    backgroundColor: Colors.Background,
    paddingTop: Spacing.md,
  },
});
