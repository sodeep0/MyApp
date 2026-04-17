import React, { useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSubscription } from '@/hooks/useSubscription';
import { signOutCurrentUser } from '@/services/firebase/auth';

const SETTINGS_SECTIONS = [
  {
    title: 'Account',
    items: [
      { icon: 'person-outline' as const, label: 'Edit Profile', route: null, tint: Colors.SteelBlue },
      { icon: 'mail-outline' as const, label: 'Email & Password', route: null, tint: Colors.SteelBlue },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'notifications-outline' as const, label: 'Notifications', route: null, tint: Colors.Success },
      { icon: 'moon-outline' as const, label: 'Appearance', route: null, tint: Colors.TextSecondary },
      { icon: 'globe-outline' as const, label: 'Language', route: null, tint: Colors.SteelBlue },
    ],
  },
  {
    title: 'Data & Privacy',
    items: [
      { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', route: null, tint: Colors.Success },
      { icon: 'cloud-download-outline' as const, label: 'Data Export', route: null, tint: Colors.Warning },
      { icon: 'trash-outline' as const, label: 'Delete Account', route: null, tint: Colors.Danger },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: 'star-outline' as const, label: 'Rate Kaarma', route: null, tint: Colors.Warning },
      { icon: 'help-circle-outline' as const, label: 'Help & Support', route: null, tint: Colors.SteelBlue },
    ],
  },
];

const GUEST_PREFERENCES = [
  {
    icon: 'moon-outline' as const,
    label: 'Appearance',
    value: 'Light Mode',
    tint: Colors.SteelBlue,
  },
  {
    icon: 'globe-outline' as const,
    label: 'Language',
    value: 'English',
    tint: Colors.SteelBlue,
  },
];

const GUEST_APP_INFO = [
  {
    icon: 'information-circle-outline' as const,
    label: 'About Kaarma',
    external: true,
    tint: Colors.Warning,
  },
  {
    icon: 'help-circle-outline' as const,
    label: 'Help & Support',
    tint: Colors.SteelBlue,
  },
  {
    icon: 'star-outline' as const,
    label: 'Rate the App',
    tint: Colors.SteelBlue,
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [displayName, setDisplayName] = useLocalStorage('kaarma_display_name', 'User');
  const [email, setEmail] = useLocalStorage('kaarma_user_email', 'user@kaarma.app');
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage('kaarma_logged_in', false);
  const { isPremium } = useSubscription();
  const [editingName, setEditingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogOut = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setEditingName(false);
          await signOutCurrentUser();
          await setIsLoggedIn(false);
          await setEmail('user@kaarma.app');
          router.replace('/profile' as any);
        },
      },
    ]);
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setEditingName(false);
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isLoggedIn ? (
          <>
            <View style={styles.guestHeroCard}>
              <View style={styles.guestIconWrap}>
                <Ionicons name="sparkles-outline" size={34} color={Colors.SteelBlue} />
              </View>
              <Text style={styles.guestTitle}>Start Your Mindful Journey</Text>
              <Text style={styles.guestSubtitle}>
                Discover the art of intentional living through curated rituals and journaling.
              </Text>

              <View style={styles.authActions}>
                <Button
                  label="Sign In"
                  fullWidth
                  onPress={() => router.push('/auth/sign-in' as any)}
                />
                <Button
                  label="Create Account"
                  variant="secondary"
                  fullWidth
                  onPress={() => router.push('/auth/create-account' as any)}
                />
              </View>
            </View>

            <View style={styles.guestSection}>
              <View style={styles.guestSectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.guestSectionTitle}>Preferences</Text>
                <View style={styles.dividerLine} />
              </View>

              <Card style={styles.sectionCard} noShadow>
                {GUEST_PREFERENCES.map((item, idx) => (
                  <Pressable
                    key={item.label}
                    style={[styles.menuItem, idx < GUEST_PREFERENCES.length - 1 && styles.menuItemBorder]}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.tint + '18' }]}>
                      <Ionicons name={item.icon} size={16} color={item.tint} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.trailingValue}>{item.value}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.TextSecondary} />
                  </Pressable>
                ))}
              </Card>
            </View>

            <View style={styles.guestSection}>
              <View style={styles.guestSectionDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.guestSectionTitle}>App Info</Text>
                <View style={styles.dividerLine} />
              </View>

              <Card style={styles.sectionCard} noShadow>
                {GUEST_APP_INFO.map((item, idx) => (
                  <Pressable
                    key={item.label}
                    style={[styles.menuItem, idx < GUEST_APP_INFO.length - 1 && styles.menuItemBorder]}
                    onPress={() => Alert.alert(item.label, 'This option will be available soon.')}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: item.tint + '18' }]}>
                      <Ionicons name={item.icon} size={16} color={item.tint} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Ionicons
                      name={item.external ? 'open-outline' : 'chevron-forward'}
                      size={16}
                      color={Colors.TextSecondary}
                    />
                  </Pressable>
                ))}
              </Card>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.brandTitle}>Kaarma</Text>
              <Text style={styles.brandTagline}>Own Your Day. Every Day.</Text>
            </View>

            <Card style={styles.profileCard}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={28} color={Colors.SteelBlue} />
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  {editingName ? (
                    <TextInput
                      style={styles.nameInput}
                      value={displayName as string}
                      onChangeText={setDisplayName}
                      onBlur={() => setEditingName(false)}
                      autoFocus
                      onSubmitEditing={() => setEditingName(false)}
                    />
                  ) : (
                    <Pressable onPress={() => setEditingName(true)}>
                      <Text style={styles.displayName}>{String(displayName)}</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => setEditingName(true)} style={styles.editBtn}>
                    <Ionicons name="pencil" size={14} color={Colors.TextSecondary} />
                  </Pressable>
                </View>
                <Text style={styles.email}>{String(email)}</Text>
                {isPremium ? (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={10} color={Colors.Surface} />
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.upgradeBadge}
                    onPress={() => router.push('/premium' as any)}
                  >
                    <Ionicons name="diamond-outline" size={10} color={Colors.SteelBlue} />
                    <Text style={styles.upgradeText}>Upgrade to Premium</Text>
                  </Pressable>
                )}
              </View>
            </Card>

            {SETTINGS_SECTIONS.map((section, sIdx) => (
              <View key={sIdx} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionCardLoggedIn}>
                  {section.items.map((item, iIdx) => (
                    <Pressable
                      key={iIdx}
                      style={[styles.menuItem, iIdx < section.items.length - 1 && styles.menuItemBorder]}
                      onPress={() => {
                        if (item.label === 'Delete Account') {
                          // Handle delete
                        }
                      }}
                    >
                      <View style={[styles.menuIcon, { backgroundColor: item.tint + '18' }]}>
                        <Ionicons name={item.icon} size={18} color={item.tint} />
                      </View>
                      <Text style={[
                        styles.menuLabel,
                        item.label === 'Delete Account' && styles.menuLabelDanger,
                      ]}>
                        {item.label}
                      </Text>
                      {item.label === 'Notifications' ? (
                        <Switch
                          value={notificationsEnabled}
                          onValueChange={setNotificationsEnabled}
                          trackColor={{ false: Colors.BorderSubtle, true: Colors.SteelBlue + '80' }}
                          thumbColor={notificationsEnabled ? Colors.SteelBlue : Colors.Surface}
                        />
                      ) : (
                        <Ionicons name="chevron-forward" size={16} color={Colors.TextSecondary} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}

            <Pressable style={styles.logoutButton} onPress={handleLogOut}>
              <Ionicons name="log-out-outline" size={18} color={Colors.Danger} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </Pressable>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Kaarma</Text>
          <Text style={styles.footerVersion}>v1.0.0</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    fontWeight: '700' as const,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxl,
  },
  guestHeroCard: {
    backgroundColor: Colors.SurfaceContainerLow,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  guestIconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  guestTitle: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  guestSubtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  authActions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  guestSection: {
    marginBottom: Spacing.md,
  },
  guestSectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.BorderSubtle,
  },
  guestSectionTitle: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: 'none',
    fontStyle: 'italic',
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  brandTitle: {
    ...Typography.Display,
    color: Colors.SteelBlue,
    letterSpacing: -0.5,
  },
  brandTagline: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    letterSpacing: 0.5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.SoftSky + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  displayName: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  nameInput: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  editBtn: {
    padding: Spacing.xs,
  },
  email: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.SteelBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Shapes.Badge,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  premiumText: {
    ...Typography.Micro,
    color: Colors.Surface,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.SteelBlue + '18',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Shapes.Badge,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  upgradeText: {
    ...Typography.Micro,
    color: Colors.SteelBlue,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    overflow: 'hidden',
  },
  sectionCardLoggedIn: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    overflow: 'hidden',
    ...Shadows.Card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle + '80',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: Shapes.IconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    flex: 1,
  },
  menuLabelDanger: {
    color: Colors.Danger,
  },
  trailingValue: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
  },
  logoutButton: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.Danger + '40',
    borderRadius: Shapes.Input,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: Colors.Danger + '0D',
  },
  logoutButtonText: {
    ...Typography.Body1,
    color: Colors.Danger,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  footerBrand: {
    ...Typography.Caption,
    color: Colors.DustyTaupe,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  footerVersion: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
});
