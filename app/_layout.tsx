import { flushActivityQueue } from "@/repositories/firebase/activityRepository.firebase";
import { flushGoalQueue } from "@/repositories/firebase/goalRepository.firebase";
import { flushHabitQueue } from "@/repositories/firebase/habitRepository.firebase";
import { flushUserQueue } from "@/repositories/firebase/userRepository.firebase";
import { isFirebaseConfigured } from "@/services/firebase/app";
import { ensureAnonymousAuth } from "@/services/firebase/auth";
import { subscribeSyncTriggers } from "@/services/sync/networkState";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();
console.log("🔵 Root layout module loaded");
WebBrowser.maybeCompleteAuthSession(); // ✅ module level

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
  const flushPendingSync = async () => {
    if (!isFirebaseConfigured()) return;
    await Promise.allSettled([
      flushUserQueue(),
      flushHabitQueue(),
      flushGoalQueue(),
      flushActivityQueue(),
    ]);
  };

  useEffect(() => {
    const init = async () => {
      await ensureAnonymousAuth();
      await flushPendingSync();
      await SplashScreen.hideAsync();
    };
    init();
  }, []);

  useEffect(() => {
    return subscribeSyncTriggers(() => {
      flushPendingSync();
    });
  }, []);

  const [fontsLoaded] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
    "Inter-ExtraBold": Inter_800ExtraBold,
    "Inter-Black": Inter_900Black,
  });

  // ✅ Always render Stack — never return null
  // Deep links (auth redirect) need Stack to be mounted to work
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {fontsLoaded && (
        // ✅ StatusBar only after fonts ready
        <StatusBar style="dark" />
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="oauthredirect" options={{ headerShown: false }} />
        <Stack.Screen
          name="premium"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
