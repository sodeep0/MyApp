import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import {
  createAccountWithEmailPassword,
  signInWithGoogleIdToken,
} from "@/services/firebase/auth";
import { storage } from "@/storage/asyncStorage";

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getCreateAccountErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/weak-password":
      return "Use a stronger password (at least 6 characters).";
    case "auth/operation-not-allowed":
      return "Email/password sign-up is not enabled yet.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Could not create account. Please try again.";
  }
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleCreateAccount = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!looksLikeEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const user = await createAccountWithEmailPassword(
        normalizedEmail,
        password,
        trimmedName || undefined,
      );

      await storage.setItem("kaarma_user_email", user.email ?? normalizedEmail);
      await storage.setItem(
        "kaarma_display_name",
        user.displayName || trimmedName || user.email?.split("@")[0] || "User",
      );

      router.replace("/profile" as any);
    } catch (nextError) {
      setError(getCreateAccountErrorMessage(nextError));
    } finally {
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
        <Text style={styles.subtitle}>Create an account with email or Google.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Display name (optional)</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={Colors.TextSecondary} />
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={Colors.TextSecondary}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={Colors.TextSecondary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.TextSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.TextSecondary} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.TextSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />
          </View>

          <Text style={styles.label}>Confirm password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.TextSecondary} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor={Colors.TextSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              onSubmitEditing={() => {
                void handleCreateAccount();
              }}
            />
          </View>

          <Button
            label="Create Account"
            icon="person-add-outline"
            fullWidth
            loading={submitting}
            onPress={() => {
              void handleCreateAccount();
            }}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Continue with Google"
            icon="logo-google"
            variant="secondary"
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
  subtitle: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: -Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Shapes.Card,
    backgroundColor: Colors.Surface,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    gap: Spacing.sm,
    ...Shadows.Card,
  },
  label: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  inputWrap: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    borderRadius: Shapes.Input,
    backgroundColor: Colors.SurfaceContainerLow,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  input: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.BorderSubtle,
  },
  dividerText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textTransform: "uppercase",
  },
  error: { color: Colors.Danger, marginTop: 10 },
  link: { textAlign: "center", marginTop: Spacing.xl },
  bold: { fontWeight: "700" },
});
