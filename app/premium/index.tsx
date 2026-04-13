import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { useSubscription } from '@/hooks/useSubscription';

const PREMIUM_FEATURES = [
  { icon: 'time-outline', text: 'Unlimited habit history' },
  { icon: 'shield-checkmark-outline', text: 'Streak shield — restore missed days' },
  { icon: 'documents-outline', text: 'Unlimited journal entries' },
  { icon: 'image-outline', text: 'Photo attachments in journal' },
  { icon: 'flag-outline', text: 'Unlimited goals & templates' },
  { icon: 'phone-portrait-outline', text: 'Hard app blocking & focus sessions' },
  { icon: 'calendar-outline', text: 'Scheduled blocking' },
  { icon: 'cloud-upload-outline', text: 'Cloud backup & data export' },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$6.99',
    period: '/month',
    highlight: false,
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$49.99',
    period: '/year',
    highlight: true,
    savings: 'Save 40%',
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$99.99',
    period: ' once',
    highlight: false,
  },
];

export default function PremiumUpgradeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { purchaseMonthly, restorePurchases } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const handleSubscribe = () => {
    purchaseMonthly();
    router.back();
  };

  const handleRestore = () => {
    restorePurchases();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 200 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.closeContainer}>
          <View style={styles.crownCircle}>
            <Text style={styles.crownIcon}>{'\uD83D\uDC51'}</Text>
          </View>
        </View>

        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <Text style={styles.headerSubtitle}>
          Unlock everything. No limits, no distractions.
        </Text>

        <View style={styles.features}>
          {PREMIUM_FEATURES.map((feature, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name={feature.icon as any} size={16} color={Colors.SteelBlue} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.plansTitle}>CHOOSE YOUR PLAN</Text>
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={({ pressed }) => [
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.highlight && styles.planCardHighlight,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              {plan.highlight && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.planRow}>
                <View style={styles.planLabelCol}>
                  <Text style={[styles.planLabel, selectedPlan === plan.id && styles.planLabelActive]}>
                    {plan.label}
                  </Text>
                  {plan.savings && (
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  )}
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.planDollar}>$</Text>
                  <Text style={styles.planAmount}>{plan.price.replace('$', '')}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
              {selectedPlan === plan.id && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.SteelBlue} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label="Start 7-Day Free Trial"
          onPress={handleSubscribe}
          fullWidth
        />
        <View style={styles.bottomLinks}>
          <Pressable onPress={handleRestore} style={styles.bottomLink}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </Pressable>
          <Text style={styles.divider}>{'\u2022'}</Text>
          <Pressable onPress={() => router.back()} style={styles.bottomLink}>
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
        </View>
        <Text style={styles.cancelText}>Cancel anytime. 7-day free trial included.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  closeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  crownCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.WarmSand,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.HeroCard,
  },
  crownIcon: {
    fontSize: 32,
  },
  headerTitle: {
    ...Typography.Display,
    color: Colors.TextPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  features: {
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureIconBox: {
    width: 28,
    height: 28,
    borderRadius: Shapes.IconBg,
    backgroundColor: Colors.SteelBlue + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    flex: 1,
  },
  plansTitle: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  plansContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  planCard: {
    backgroundColor: Colors.Background,
    borderRadius: Shapes.Card,
    borderWidth: 1.5,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SteelBlue + '08',
  },
  planCardHighlight: {
    borderColor: Colors.Warning,
    backgroundColor: Colors.WarmSand + '80',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    backgroundColor: Colors.Warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Shapes.Badge,
  },
  bestValueText: {
    ...Typography.Micro,
    color: Colors.Surface,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLabelCol: {
    flex: 1,
  },
  planLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '600',
  },
  planLabelActive: {
    color: Colors.SteelBlue,
  },
  savingsText: {
    ...Typography.Caption,
    color: Colors.Success,
    fontWeight: '600',
    marginTop: 2,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planDollar: {
    ...Typography.Caption,
    color: Colors.TextPrimary,
  },
  planAmount: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  planPeriod: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.Surface,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  divider: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  bottomLink: {},
  restoreText: {
    ...Typography.Caption,
    color: Colors.SteelBlue,
    textDecorationLine: 'underline',
  },
  notNowText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  cancelText: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});