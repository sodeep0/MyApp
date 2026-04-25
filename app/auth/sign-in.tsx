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
  signInWithEmailPassword,
  signInWithGoogleIdToken,
} from "@/services/firebase/auth";
import { storage } from "@/storage/asyncStorage";

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getSignInErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Incorrect email or password.";
    case "auth/user-disabled":
      return "This account is disabled.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { response, promptGoogleAuth, hasGoogleConfig } = useGoogleAuthRequest();

  useEffect(() => {
    const completeSignIn = async () => {
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
        setError("Google sign-in failed.");
      } finally {
        setSubmitting(false);
      }
    };

    completeSignIn();
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
      setError("Google sign-in failed.");
      setSubmitting(false);
    }
  };

  const handleEmailSignIn = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!looksLikeEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const user = await signInWithEmailPassword(normalizedEmail, password);

      await storage.setItem("kaarma_user_email", user.email ?? normalizedEmail);
      await storage.setItem(
        "kaarma_display_name",
        user.displayName || user.email?.split("@")[0] || "User",
      );

      router.replace("/profile" as any);
    } catch (nextError) {
      setError(getSignInErrorMessage(nextError));
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
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with email or Google.</Text>

        <View style={styles.card}>
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
              placeholder="Your password"
              placeholderTextColor={Colors.TextSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              onSubmitEditing={() => {
                void handleEmailSignIn();
              }}
            />
          </View>

          <Button
            label="Sign In"
            icon="log-in-outline"
            fullWidth
            loading={submitting}
            onPress={() => {
              void handleEmailSignIn();
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

        <Pressable onPress={() => router.push("/auth/create-account" as any)}>
          <Text style={styles.link}>
            Don’t have an account?{" "}
            <Text style={styles.bold}>Create Account</Text>
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
