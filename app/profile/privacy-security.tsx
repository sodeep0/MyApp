import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';
import {
  ensureJournalUnlocked,
  getJournalLockCapability,
  isJournalSessionUnlocked,
  lockJournalSession,
} from '@/services/journalSecurity';
import {
  DEFAULT_SECURITY_SETTINGS,
  type SecuritySettings,
  updateSecuritySettings,
  getSecuritySettings,
} from '@/stores/securityStore';
import {
  getSensitiveDataRecoveryState,
  resetSensitiveDataStorage,
} from '@/storage/secureDataStorage';

const UNLOCK_TIMEOUT_OPTIONS = [1, 5, 15] as const;

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS);
  const [hasBiometricSupport, setHasBiometricSupport] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([]);
  const [recoveryDetectedAt, setRecoveryDetectedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadState = useCallback(async () => {
    const [nextSettings, capability, recoveryState] = await Promise.all([
      getSecuritySettings(),
      getJournalLockCapability(),
      getSensitiveDataRecoveryState(),
    ]);

    setSettings(nextSettings);
    setHasBiometricSupport(capability.hasHardware);
    setIsEnrolled(capability.isEnrolled);
    setRecoveryKeys(recoveryState.corruptedKeys);
    setRecoveryDetectedAt(recoveryState.lastDetectedAt);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const run = async () => {
        await loadState();
        if (!isActive) return;
      };

      run();

      return () => {
        isActive = false;
      };
    }, [loadState]),
  );

  const applySettingsUpdate = useCallback(async (updates: Partial<SecuritySettings>) => {
    const next = await updateSecuritySettings(updates);
    setSettings(next);
    return next;
  }, []);

  const handleToggleJournalLock = useCallback(
    async (nextEnabled: boolean) => {
      if (!nextEnabled) {
        await applySettingsUpdate({ journalLockEnabled: false });
        lockJournalSession();
        return;
      }

      const capability = await getJournalLockCapability();
      setHasBiometricSupport(capability.hasHardware);
      setIsEnrolled(capability.isEnrolled);

      if (!capability.available) {
        Alert.alert(
          'Device Authentication Required',
          'Enable a device passcode or biometric lock first, then try enabling journal lock again.',
        );
        return;
      }

      await applySettingsUpdate({ journalLockEnabled: true });
      lockJournalSession();
    },
    [applySettingsUpdate],
  );

  const handleRefreshUnlockState = useCallback(async () => {
    const result = await ensureJournalUnlocked();
    if (result === 'cancelled') return;

    if (result === 'unavailable') {
      Alert.alert(
        'Journal Lock Unavailable',
        'This device no longer has biometric/passcode authentication configured.',
      );
      return;
    }

    setSettings((previous) => ({ ...previous }));
  }, []);

  const handleResetSensitiveData = useCallback(() => {
    Alert.alert(
      'Reset Sensitive Data?',
      'This will permanently clear local journal entries, bad habits, and urge events stored in encrypted storage. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await resetSensitiveDataStorage();
              lockJournalSession();
              setRecoveryKeys([]);
              setRecoveryDetectedAt(null);
              Alert.alert(
                'Sensitive Data Reset',
                'Encrypted local sensitive data was reset. You can continue using Journal and recovery tracking with a fresh secure store.',
              );
            })();
          },
        },
      ],
    );
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <Text style={styles.headerSubtitle}>Protect your local sensitive data</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading security settings...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.SteelBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Journal Lock</Text>
                  <Text style={styles.cardDescription}>
                    Require biometrics or device passcode to open Journal screens.
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.journalLockEnabled}
                onValueChange={handleToggleJournalLock}
                trackColor={{ false: Colors.BorderSubtle, true: Colors.SteelBlue + '88' }}
                thumbColor={settings.journalLockEnabled ? Colors.SteelBlue : Colors.Surface}
              />
            </View>

            <View style={styles.capabilityRow}>
              <Text style={styles.capabilityText}>
                Hardware: {hasBiometricSupport ? 'available' : 'not available'}
              </Text>
              <Text style={styles.capabilityText}>
                Enrollment: {isEnrolled ? 'configured' : 'not configured'}
              </Text>
            </View>

            {settings.journalLockEnabled && (
              <>
                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>Unlock Session Timeout</Text>
                <View style={styles.optionRow}>
                  {UNLOCK_TIMEOUT_OPTIONS.map((minutes) => {
                    const selected = settings.journalUnlockTimeoutMinutes === minutes;
                    return (
                      <Pressable
                        key={minutes}
                        onPress={() => applySettingsUpdate({ journalUnlockTimeoutMinutes: minutes })}
                        style={[styles.optionChip, selected && styles.optionChipSelected]}
                      >
                        <Text style={[styles.optionChipText, selected && styles.optionChipTextSelected]}>
                          {minutes}m
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                    <Text style={styles.switchTitle}>Relock when app goes to background</Text>
                    <Text style={styles.switchSubtitle}>Recommended for shared devices.</Text>
                  </View>
                  <Switch
                    value={settings.relockOnBackground}
                    onValueChange={(value) => {
                      void applySettingsUpdate({ relockOnBackground: value });
                    }}
                    trackColor={{ false: Colors.BorderSubtle, true: Colors.SteelBlue + '88' }}
                    thumbColor={settings.relockOnBackground ? Colors.SteelBlue : Colors.Surface}
                  />
                </View>

                <Pressable style={styles.lockNowButton} onPress={lockJournalSession}>
                  <Ionicons name="lock-closed" size={14} color={Colors.TextSecondary} />
                  <Text style={styles.lockNowText}>
                    {isJournalSessionUnlocked() ? 'Lock Journal Now' : 'Journal is currently locked'}
                  </Text>
                </Pressable>

                <Pressable style={styles.unlockCheckButton} onPress={handleRefreshUnlockState}>
                  <Ionicons name="scan-outline" size={14} color={Colors.SteelBlue} />
                  <Text style={styles.unlockCheckText}>Unlock now to test access</Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Colors.Success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Sensitive Data Storage</Text>
                <Text style={styles.cardDescription}>
                  Journal, bad-habit, and urge-event records are encrypted before local persistence.
                </Text>
                <Text style={styles.helperText}>
                  Existing plaintext records are migrated to encrypted storage automatically.
                </Text>
                <Text style={styles.helperText}>
                  Native devices use secure key storage. Web keeps a development fallback key in local storage.
                </Text>
              </View>
            </View>
          </View>

          {(recoveryKeys.length > 0 || recoveryDetectedAt) && (
            <View style={styles.card}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconWrap, styles.warningIconWrap]}>
                  <Ionicons name="warning-outline" size={18} color={Colors.Warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Secure Data Recovery</Text>
                  <Text style={styles.cardDescription}>
                    We detected encrypted local data that could not be decrypted with the current key.
                  </Text>
                  {recoveryKeys.length > 0 && (
                    <Text style={styles.helperText}>
                      Affected stores: {recoveryKeys.length}
                    </Text>
                  )}
                  {recoveryDetectedAt && (
                    <Text style={styles.helperText}>
                      First detected: {new Date(recoveryDetectedAt).toLocaleString('en-US')}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable style={styles.resetButton} onPress={handleResetSensitiveData}>
                <Ionicons name="refresh-outline" size={14} color={Colors.Danger} />
                <Text style={styles.resetButtonText}>Reset Sensitive Data</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...CommonStyles.screenContainer,
  },
  header: {
    ...CommonStyles.stackHeader,
  },
  headerBtn: {
    ...CommonStyles.stackHeaderButton,
  },
  headerCenter: {
    ...CommonStyles.stackHeaderCenter,
  },
  headerTitle: {
    ...CommonStyles.stackHeaderTitle,
  },
  headerSubtitle: {
    ...CommonStyles.stackHeaderSubtitle,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    ...CommonStyles.surfaceCard,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    flex: 1,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.SoftSky + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  warningIconWrap: {
    backgroundColor: Colors.Warning + '22',
  },
  cardTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
    lineHeight: 24,
  },
  cardDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  capabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  capabilityText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.BorderSubtle,
  },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  optionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionChip: {
    borderRadius: Shapes.Chip,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.SurfaceContainerLow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  optionChipSelected: {
    backgroundColor: Colors.SoftSky + '28',
    borderColor: Colors.SteelBlue,
  },
  optionChipText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  optionChipTextSelected: {
    color: Colors.SteelBlue,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  switchTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },
  switchSubtitle: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  lockNowButton: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Shapes.Input,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.SurfaceContainerLow,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  lockNowText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    fontWeight: '600',
  },
  unlockCheckButton: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Shapes.Input,
    borderWidth: 1,
    borderColor: Colors.SteelBlue + '40',
    backgroundColor: Colors.SteelBlue + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  unlockCheckText: {
    ...Typography.Body2,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  helperText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  resetButton: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Shapes.Input,
    borderWidth: 1,
    borderColor: Colors.Danger + '50',
    backgroundColor: Colors.Danger + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  resetButtonText: {
    ...Typography.Body2,
    color: Colors.Danger,
    fontWeight: '700',
  },
});
