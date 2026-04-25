import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { Button } from '@/components/Button';
import { LoadingState } from '@/components/LoadingState';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { isFirebaseConfigured } from '@/services/firebase/app';
import { ensureAnonymousAuth } from '@/services/firebase/auth';
import { initializeJournalSecurityLifecycle } from '@/services/journalSecurity';
import { subscribeSyncTriggers } from '@/services/sync/networkState';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { InteractionManager, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

void SplashScreen.preventAutoHideAsync();
WebBrowser.maybeCompleteAuthSession();

const DefaultText = Text as typeof Text & {
  defaultProps?: React.ComponentProps<typeof Text>;
};
const DefaultTextInput = TextInput as typeof TextInput & {
  defaultProps?: React.ComponentProps<typeof TextInput>;
};

DefaultText.defaultProps = DefaultText.defaultProps ?? {};
DefaultText.defaultProps.allowFontScaling = false;

DefaultTextInput.defaultProps = DefaultTextInput.defaultProps ?? {};
DefaultTextInput.defaultProps.allowFontScaling = false;

export default function RootLayout() {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const flushPendingSync = useCallback(async () => {
    if (!isFirebaseConfigured()) return;

    const [
      { flushUserQueue },
      { flushHabitQueue },
      { flushGoalQueue },
      { flushActivityQueue },
    ] = await Promise.all([
      import('@/repositories/firebase/userRepository.firebase'),
      import('@/repositories/firebase/habitRepository.firebase'),
      import('@/repositories/firebase/goalRepository.firebase'),
      import('@/repositories/firebase/activityRepository.firebase'),
    ]);

    await Promise.allSettled([
      flushUserQueue(),
      flushHabitQueue(),
      flushGoalQueue(),
      flushActivityQueue(),
    ]);
  }, []);

  const initializeBackgroundServices = useCallback(async () => {
    const {
      initializeNotificationsAsync,
      syncManagedNotificationsAsync,
    } = await import('@/services/notifications');

    await initializeNotificationsAsync();
    await syncManagedNotificationsAsync();
  }, []);

  const syncNotificationSchedules = useCallback(async () => {
    const { syncManagedNotificationsAsync } = await import('@/services/notifications');
    await syncManagedNotificationsAsync();
  }, []);

  const runBootstrap = useCallback(async () => {
    setBootstrapError(null);
    setBootstrapping(true);
    let bootstrapSucceeded = false;

    try {
      await ensureAnonymousAuth();
      bootstrapSucceeded = true;
    } catch (error) {
      console.error('Failed to bootstrap app shell', error);
      setBootstrapError('Kaarma could not finish starting up.');
    } finally {
      setBootstrapping(false);
      await SplashScreen.hideAsync();
    }

    if (!bootstrapSucceeded) return;

    InteractionManager.runAfterInteractions(() => {
      void Promise.allSettled([
        flushPendingSync(),
        initializeBackgroundServices(),
      ]);
    });
  }, [flushPendingSync, initializeBackgroundServices]);

  useEffect(() => {
    initializeJournalSecurityLifecycle();
  }, []);

  useEffect(() => {
    void runBootstrap();
  }, [runBootstrap]);

  useEffect(() => {
    return subscribeSyncTriggers(() => {
      void flushPendingSync();
      void syncNotificationSchedules();
    });
  }, [flushPendingSync, syncNotificationSchedules]);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
    'Inter-Black': Inter_900Black,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      {fontsLoaded ? <StatusBar style="dark" /> : null}

      {bootstrapError ? (
        <View style={styles.bootstrapError}>
          <View style={styles.bootstrapCard}>
            <Text style={styles.bootstrapEyebrow}>Startup issue</Text>
            <Text style={styles.bootstrapTitle}>{bootstrapError}</Text>
            <Text style={styles.bootstrapMessage}>
              Retry the app bootstrap to restore auth, sync, and notification setup.
            </Text>
            <Button
              label="Retry Startup"
              onPress={() => void runBootstrap()}
              fullWidth
            />
          </View>
        </View>
      ) : bootstrapping || !fontsLoaded ? (
        <LoadingState
          fullScreen
          title="Starting Kaarma"
          message="Loading your app shell, fonts, and device services."
        />
      ) : (
        <AppErrorBoundary onReset={() => void runBootstrap()}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="oauthredirect" options={{ headerShown: false }} />
            <Stack.Screen
              name="premium"
              options={{ headerShown: false, presentation: 'modal' }}
            />
          </Stack>
          <OfflineBanner />
        </AppErrorBoundary>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bootstrapError: {
    flex: 1,
    backgroundColor: Colors.Background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenH,
  },
  bootstrapCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    backgroundColor: Colors.Surface,
    padding: Spacing.lg,
  },
  bootstrapEyebrow: {
    ...Typography.Caption,
    color: Colors.Danger,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  bootstrapTitle: {
    ...Typography.Headline2,
    color: Colors.TextPrimary,
    marginBottom: Spacing.xs,
  },
  bootstrapMessage: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginBottom: Spacing.lg,
  },
});
