// app/auth/index.tsx
import { Colors, Spacing, Typography } from "@/constants/theme";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
Linking.addEventListener("url", (event) => {
  console.log("🔗 Deep link received:", event.url);
});

console.log("🟢 Auth screen module loaded");
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  console.log("🟡 Auth screen component mounted");

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <ActivityIndicator color={Colors.SteelBlue} size="small" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.Background,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  text: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
  },
});
