import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';
import type { AppUsage } from '@/services/screenTimeService';

type BlockedAppsPanelProps = {
  apps: AppUsage[];
  blockedApps: Record<string, boolean>;
  locked: boolean;
  getAppIcon: (pkg: string, appName: string) => React.ComponentProps<typeof Ionicons>['name'];
  getAppGradient: (pkg: string, appName: string) => readonly [string, string, ...string[]];
  onToggleBlocked: (pkg: string) => void;
  onPremiumUpgrade: () => void;
};

export function BlockedAppsPanel({
  apps,
  blockedApps,
  locked,
  getAppIcon,
  getAppGradient,
  onToggleBlocked,
  onPremiumUpgrade,
}: BlockedAppsPanelProps) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons
          name="lock-closed-outline"
          size={16}
          color={Colors.TextSecondary}
        />
        <Text style={styles.sectionHeaderText}>Focus App Plan</Text>
      </View>
      <Text style={styles.sectionHelperText}>
        These toggles mark apps to avoid during focus sessions. They do not
        prevent the apps from opening.
      </Text>
      <View style={styles.blockedAppsContainer}>
        {apps.slice(0, 6).map((app, index) => {
          const isBlocked = !!blockedApps[app.packageName];
          const ionicon = getAppIcon(app.packageName, app.appName);
          const gradientColors = getAppGradient(app.packageName, app.appName);
          return (
            <View key={index} style={styles.blockedAppRow}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.blockedAppIcon,
                  isBlocked && styles.appIconBlocked,
                ]}
              >
                <Ionicons
                  name={ionicon}
                  size={18}
                  color={isBlocked ? Colors.TextSecondary : Colors.Surface}
                />
              </LinearGradient>
              <Text
                style={[
                  styles.blockedAppName,
                  isBlocked && styles.appNameBlocked,
                ]}
              >
                {app.appName}
              </Text>
              <Switch
                value={isBlocked}
                onValueChange={() => {
                  if (!locked) {
                    onToggleBlocked(app.packageName);
                    return;
                  }
                  onPremiumUpgrade();
                }}
                accessibilityLabel={`Mark ${app.appName} to avoid during focus`}
                accessibilityState={{ checked: isBlocked }}
                trackColor={{
                  false: Colors.BorderSubtle,
                  true: Colors.Danger + '80',
                }}
                thumbColor={isBlocked ? Colors.Danger : Colors.Surface}
              />
            </View>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionHeaderText: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
  },
  sectionHelperText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    lineHeight: 18,
  },
  blockedAppsContainer: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    marginTop: Spacing.sm,
  },
  blockedAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle + '60',
  },
  blockedAppIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconBlocked: {
    opacity: 0.45,
  },
  blockedAppName: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    flex: 1,
    fontWeight: '600',
  },
  appNameBlocked: {
    color: Colors.TextSecondary,
    textDecorationLine: 'line-through',
  },
});
