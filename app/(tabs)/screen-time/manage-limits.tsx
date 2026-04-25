import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';
import {
  formatMs,
  getAppLimit,
  getScreenTimeReport,
  hasScreenTimePermission,
  requestScreenTimePermission,
  setAppLimit,
  type AppUsage,
} from '@/services/screenTimeService';

function parseLimitInputToMs(rawInput: string): number | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  const minutes = Number(trimmed);
  if (!Number.isFinite(minutes)) return null;

  const roundedMinutes = Math.round(minutes);
  if (roundedMinutes <= 0) return null;

  return roundedMinutes * 60 * 1000;
}

export default function ManageAppLimitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [apps, setApps] = useState<AppUsage[]>([]);
  const [limitInputs, setLimitInputs] = useState<Record<string, string>>({});
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState<string | null>(null);

  const loadTrackedApps = useCallback(async () => {
    setLoading(true);

    const granted = await hasScreenTimePermission();
    setPermissionGranted(granted);

    if (!granted) {
      setApps([]);
      setLoading(false);
      return;
    }

    const report = await getScreenTimeReport('today');
    const nextApps = report?.apps ?? [];
    const nextAppsWithLimits = await Promise.all(
      nextApps.map(async (app) => {
        const savedLimit = await getAppLimit(app.packageName);
        return {
          ...app,
          dailyLimitMs: savedLimit,
        };
      }),
    );

    setApps(nextAppsWithLimits);

    const nextInputs: Record<string, string> = {};
    for (const app of nextAppsWithLimits) {
      nextInputs[app.packageName] =
        app.dailyLimitMs && app.dailyLimitMs > 0
          ? String(Math.round(app.dailyLimitMs / 60000))
          : '';
    }
    setLimitInputs(nextInputs);

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTrackedApps();
    }, [loadTrackedApps]),
  );

  const handleRequestPermission = async () => {
    await requestScreenTimePermission();
    await loadTrackedApps();
  };

  const handleSaveLimit = async (app: AppUsage) => {
    const limitMs = parseLimitInputToMs(limitInputs[app.packageName] ?? '');

    if (limitMs === null) {
      Alert.alert(
        'Invalid limit',
        'Enter a positive number of minutes, or use Clear to remove the limit.',
      );
      return;
    }

    setSavingPackage(app.packageName);

    try {
      await setAppLimit(app.packageName, limitMs);
      await loadTrackedApps();
    } catch {
      Alert.alert('Could not save limit', 'Please try again.');
    } finally {
      setSavingPackage(null);
    }
  };

  const handleClearLimit = async (app: AppUsage) => {
    setSavingPackage(app.packageName);

    try {
      await setAppLimit(app.packageName, null);
      await loadTrackedApps();
    } catch {
      Alert.alert('Could not clear limit', 'Please try again.');
    } finally {
      setSavingPackage(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manage App Limits</Text>
          <Text style={styles.headerSubtitle}>Set daily limits for tracked apps</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {Platform.OS !== 'android' ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="phone-portrait-outline"
            size={52}
            color={Colors.DustyTaupe}
          />
          <Text style={styles.emptyTitle}>Android-only for now</Text>
          <Text style={styles.emptyDescription}>
            App limits currently require Android usage access in a native/dev build.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.SteelBlue} />
          <Text style={styles.loadingText}>Loading tracked apps...</Text>
        </View>
      ) : permissionGranted === false ? (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={52} color={Colors.SteelBlue} />
          <Text style={styles.emptyTitle}>Screen Time access needed</Text>
          <Text style={styles.emptyDescription}>
            Enable Android usage access first, then return here to set app limits.
          </Text>
          <Pressable onPress={handleRequestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>Enable Access</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.helperText}>
            Limits are in minutes per day. Leave blank and tap Clear to remove a limit.
          </Text>

          <View style={styles.card}>
            {apps.length === 0 ? (
              <View style={styles.emptyCardState}>
                <Text style={styles.emptyCardTitle}>No tracked apps yet</Text>
                <Text style={styles.emptyCardDescription}>
                  Use a few apps first, then return to set limits.
                </Text>
              </View>
            ) : (
              apps.map((app, index) => {
                const isSaving = savingPackage === app.packageName;

                return (
                  <View
                    key={app.packageName}
                    style={[
                      styles.row,
                      index < apps.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <View style={styles.rowTop}>
                      <View style={styles.appTitleWrap}>
                        <Text style={styles.appName}>{app.appName}</Text>
                        <Text style={styles.appUsage}>Used today: {formatMs(app.totalTimeMs)}</Text>
                      </View>
                      <Text style={styles.currentLimit}>
                        {app.dailyLimitMs && app.dailyLimitMs > 0
                          ? `Limit: ${formatMs(app.dailyLimitMs)}`
                          : 'No limit'}
                      </Text>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={styles.inputWrap}>
                        <TextInput
                          style={styles.input}
                          placeholder="Minutes"
                          placeholderTextColor={Colors.TextSecondary}
                          value={limitInputs[app.packageName] ?? ''}
                          onChangeText={(value) => {
                            setLimitInputs((previous) => ({
                              ...previous,
                              [app.packageName]: value,
                            }));
                          }}
                          keyboardType="number-pad"
                          editable={!isSaving}
                        />
                      </View>

                      <Pressable
                        onPress={() => {
                          void handleSaveLimit(app);
                        }}
                        disabled={isSaving}
                        style={[styles.actionBtn, isSaving && styles.actionBtnDisabled]}
                      >
                        <Text style={styles.actionBtnText}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          void handleClearLimit(app);
                        }}
                        disabled={isSaving}
                        style={[styles.clearBtn, isSaving && styles.actionBtnDisabled]}
                      >
                        <Text style={styles.clearBtnText}>Clear</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </View>
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
    fontSize: 22,
  },
  headerSubtitle: {
    ...CommonStyles.stackHeaderSubtitle,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  permissionBtn: {
    marginTop: Spacing.lg,
    minHeight: 46,
    borderRadius: Shapes.Button,
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    ...Typography.Body2,
    color: Colors.Surface,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxl,
  },
  helperText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    ...CommonStyles.surfaceCard,
    overflow: 'hidden',
  },
  emptyCardState: {
    padding: Spacing.md,
  },
  emptyCardTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  emptyCardDescription: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  appTitleWrap: {
    flex: 1,
  },
  appName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  appUsage: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  currentLimit: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Input,
    backgroundColor: Colors.SurfaceContainerLow,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  input: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    paddingVertical: Spacing.sm,
  },
  actionBtn: {
    minHeight: 42,
    borderRadius: Shapes.Button,
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: '700',
  },
  clearBtn: {
    minHeight: 42,
    borderRadius: Shapes.Button,
    borderWidth: 1,
    borderColor: Colors.DustyTaupe,
    backgroundColor: Colors.Surface,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '700',
  },
  actionBtnDisabled: {
    opacity: 0.55,
  },
});
