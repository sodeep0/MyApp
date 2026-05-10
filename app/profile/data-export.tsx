import React, { useCallback, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/Button';
import { CommonStyles } from '@/constants/commonStyles';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';
import { safeBack } from '@/navigation/safeBack';
import { buildExportPayload } from '@/services/dataExport';

export default function DataExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) return;

    setExporting(true);
    try {
      const payload = await buildExportPayload();
      const json = JSON.stringify(payload, null, 2);
      const warningSummary =
        payload.warnings.length > 0
          ? `Kaarma export warnings:\n${payload.warnings.map((warning) => `- ${warning}`).join('\n')}\n\n`
          : '';
      await Share.share({
        title: 'Kaarma data export',
        message: `${warningSummary}${json}`,
      });
    } catch {
      Alert.alert('Export failed', 'Kaarma could not prepare your export. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => safeBack(router, '/profile')} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Data Export</Text>
          <Text style={styles.headerSubtitle}>Portable JSON</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text-outline" size={36} color={Colors.SteelBlue} />
        </View>
        <Text style={styles.title}>Export your Kaarma data</Text>
        <Text style={styles.body}>
          Create a readable JSON export with your current profile, habits, completions,
          goals, activities, journal entries, bad habits, urge logs, and screen-time settings.
        </Text>

        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.Success} />
          <Text style={styles.noticeText}>
            Journal and bad-habit records are read directly from this device for export.
            They are not synced to Firebase. The export is prepared locally and shared as JSON.
          </Text>
        </View>

        <Button
          label={exporting ? 'Preparing Export...' : 'Share JSON Export'}
          onPress={handleExport}
          fullWidth
          disabled={exporting}
        />
      </View>
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
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.SoftSky + '24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
  },
  body: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    lineHeight: 23,
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  noticeText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
