import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import {
  Colors,
  Shadows,
  Shapes,
  Spacing,
  Typography,
} from "@/constants/theme";
import {
  extractGoogleIdToken,
  useGoogleAuthRequest,
} from "@/hooks/useGoogleAuthRequest";
import { signInWithGoogleIdToken } from "@/services/firebase/auth";
import { storage } from "@/storage/asyncStorage";

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { response, promptGoogleAuth, hasGoogleConfig } = useGoogleAuthRequest();

  useEffect(() => {
    const completeSignUp = async () => {
      if (!response) return;

      if (response.type !== "success") {
        setSubmitting(false);
        return;
      }

      try {
        const idToken = extractGoogleIdToken(response);
        if (!idToken) throw new Error("Missing ID token");

        const user = await signInWithGoogleIdToken(idToken);

        await storage.setItem("kaarma_user_email", user.email ?? "");
        await storage.setItem(
          "kaarma_display_name",
          user.displayName || user.email?.split("@")[0] || "User",
        );

        router.replace("/profile" as any);
      } catch {
        setError("Google sign-up failed.");
      } finally {
        setSubmitting(false);
      }
    };

    completeSignUp();
  }, [response, router]);

  const handleGoogle = async () => {
    if (!hasGoogleConfig) {
      setError("Google auth not configured.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await promptGoogleAuth();
    } catch {
      setError("Google sign-up failed.");
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.TextPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Start your journey</Text>

        <View style={styles.card}>
          <Button
            label="Continue with Google"
            icon="logo-google"
            fullWidth
            loading={submitting}
            disabled={!hasGoogleConfig}
            onPress={handleGoogle}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>

        <Pressable onPress={() => router.push("/auth/sign-in" as any)}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.bold}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  headerTitle: { ...Typography.Headline2 },
  content: { padding: Spacing.lg },
  title: { ...Typography.Display, marginBottom: Spacing.lg },
  card: {
    padding: Spacing.md,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    ...Shadows.Card,
  },
  error: { color: Colors.Danger, marginTop: 10 },
  link: { textAlign: "center", marginTop: Spacing.xl },
  bold: { fontWeight: "700" },
});
