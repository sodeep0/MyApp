import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';

function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

interface ModuleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  count?: string;
  onPress: () => void;
}

function ModuleCard({ icon, title, description, color, count, onPress }: ModuleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleCard,
        { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View style={[styles.moduleIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={styles.moduleContent}>
        <Text style={styles.moduleTitle}>{title}</Text>
        <Text style={styles.moduleDescription}>{description}</Text>
      </View>
      {count !== undefined && (
        <View style={[styles.moduleBadge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.moduleBadgeText, { color }]}>{count}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={Colors.DustyTaupe} />
    </Pressable>
  );
}

export default function TrackHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Track</Text>
          <Text style={styles.subtitle}>{getDateString()}</Text>
        </View>
        <Pressable style={styles.headerBtn} hitSlop={8}>
          <Ionicons name="help-circle-outline" size={28} color={Colors.TextPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modulesList}>
          <ModuleCard
            icon="shield-checkmark"
            title="Bad Habits"
            description="Track addictions and monitor clean streaks"
            color={Colors.Success}
            onPress={() => router.push('/track/bad-habits' as any)}
          />
          <ModuleCard
            icon="book"
            title="Journal"
            description="Daily reflections with mood tracking"
            color={Colors.SteelBlue}
            onPress={() => router.push('/track/journal' as any)}
          />
          <ModuleCard
            icon="bar-chart"
            title="Activity Log"
            description="Log exercise, work, learning, and more"
            color={Colors.Warning}
            onPress={() => router.push('/track/activity' as any)}
          />
        </View>

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={14} color={Colors.TextSecondary} />
          <Text style={styles.privacyText}>
            All tracked data stays on your device. Never synced or shared.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  headerBtn: {
    padding: Spacing.sm,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  modulesList: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.Card,
  },
  moduleIcon: {
    width: 52,
    height: 52,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  moduleContent: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontSize: 18,
    lineHeight: 24,
  },
  moduleDescription: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    lineHeight: 20,
  },
  moduleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
    flexShrink: 0,
  },
  moduleBadgeText: {
    ...Typography.Caption,
    fontWeight: '700',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.WarmSand + '60',
    borderRadius: Shapes.Chip,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.screenH,
    marginTop: Spacing.lg,
  },
  privacyText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
});