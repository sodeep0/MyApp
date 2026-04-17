import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Colors, Spacing, Typography, Shapes, Shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { storage } from '@/storage/asyncStorage';
import { signInWithGoogleIdToken } from '@/services/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasGoogleConfig = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  );

  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  const handleGoogleCreate = async () => {
    if (!hasGoogleConfig) {
      setError('Google sign-up is not configured. Add EXPO_PUBLIC_GOOGLE_*_CLIENT_ID values to .env.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setSubmitting(false);
        return;
      }

      const idToken = result.params?.id_token;
      if (!idToken) {
        throw new Error('Google id token missing');
      }

      const user = await signInWithGoogleIdToken(idToken);
      await storage.setItem('kaarma_logged_in', true);
      await storage.setItem('kaarma_user_email', user.email ?? 'user@kaarma.app');
      await storage.setItem('kaarma_display_name', user.displayName || (user.email?.split('@')[0] || 'User'));
      router.replace('/profile' as any);
    } catch {
      setError('Google sign-up failed. Check Firebase + Google OAuth setup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top }]}> 
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Start your journey to intentional living.</Text>
        <View style={styles.titleAccent} />

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Continue with</Text>

          <Button
            label="Google"
            icon="logo-google"
            fullWidth
            loading={submitting}
            disabled={!request || !hasGoogleConfig}
            onPress={handleGoogleCreate}
          />

          {!hasGoogleConfig && (
            <View style={styles.configNotice}>
              <Ionicons name="warning-outline" size={16} color={Colors.Warning} />
              <Text style={styles.configNoticeText}>
                Google auth is not set up. Add Google client IDs in `.env`.
              </Text>
            </View>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.termsText}>
            By signing up, you agree to our Terms and Privacy Policy.
          </Text>
        </View>

        <Pressable onPress={() => router.push('/auth/sign-in' as any)}>
          <Text style={styles.footerLink}>
            Already have an account? <Text style={styles.footerLinkStrong}>Sign In</Text>
          </Text>
        </Pressable>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
  },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.Display,
    color: Colors.TextPrimary,
    lineHeight: 44,
    marginBottom: Spacing.sm,
    maxWidth: 320,
  },
  titleAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.SteelBlue,
    marginBottom: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.Card,
  },
  sectionLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorText: {
    ...Typography.Body2,
    color: Colors.Danger,
  },
  configNotice: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: Colors.Warning + '14',
    borderWidth: 1,
    borderColor: Colors.Warning + '55',
    borderRadius: Shapes.Input,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  configNoticeText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    flex: 1,
  },
  termsText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: 'center',
  },
  footerLink: {
    ...Typography.Body1,
    color: Colors.TextSecondary,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  footerLinkStrong: {
    color: Colors.SteelBlue,
    fontWeight: '700',
  },
});
