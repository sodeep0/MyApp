import PermissionGate from "@/components/screenTime/PermissionGate";
import { PremiumLockedBanner } from "@/components/PremiumLockedBanner";
import { getPremiumFeatureGate } from "@/constants/featureLimits";
import {
  Colors,
  Shadows,
  Shapes,
  Spacing,
  Typography,
} from "@/constants/theme";
import {
  formatMs,
  getLimitPercent,
  getScreenTimeReport,
  getWeeklyReport,
  hasScreenTimePermission,
  isLimitReached,
  type AppUsage,
  type ScreenTimeReport,
} from "@/services/screenTimeService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useSubscription } from "@/hooks/useSubscription";
import React, { Component, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

class ScreenTimeErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Ionicons
            name="phone-portrait-outline"
            size={64}
            color={Colors.DustyTaupe}
          />
          <Text style={errorStyles.title}>Screen Time Unavailable</Text>
          <Text style={errorStyles.description}>
            Screen time tracking requires an Android device with a development
            build.{"\n\n"}You can still explore the screen time UI below.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.Background,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

interface SimplePressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

function SimplePressable({ onPress, style, children }: SimplePressableProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

function AnimatedPressable({
  onPress,
  style,
  children,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <SimplePressable onPress={onPress} style={style}>
      {children}
    </SimplePressable>
  );
}

function getDateString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const FOCUS_DURATIONS = [
  { label: "25", unit: "min" },
  { label: "45", unit: "min" },
  { label: "60", unit: "min" },
];

const PRIMARY_CONTAINER = "#5d6d99" as const;

const APP_CATEGORIES = [
  {
    key: "social",
    label: "Social",
    icon: "people-outline" as const,
    color: "#E1306C",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    icon: "film-outline" as const,
    color: "#833AB4",
  },
  {
    key: "games",
    label: "Games",
    icon: "game-controller-outline" as const,
    color: "#1DB954",
  },
];

function getAppIcon(
  packageName: string,
  appName: string,
): keyof typeof Ionicons.glyphMap {
  const pkg = packageName.toLowerCase();
  const name = appName.toLowerCase();
  if (pkg.includes("instagram") || name.includes("instagram"))
    return "camera-outline";
  if (pkg.includes("youtube") || name.includes("youtube"))
    return "play-outline";
  if (pkg.includes("twitter") || pkg.includes("x.") || name.includes("twitter"))
    return "logo-twitter";
  if (pkg.includes("whatsapp") || name.includes("whatsapp"))
    return "chatbubble-ellipses-outline";
  if (pkg.includes("chrome") || name.includes("chrome")) return "globe-outline";
  if (pkg.includes("facebook") || name.includes("facebook"))
    return "logo-facebook";
  if (pkg.includes("tiktok") || name.includes("tiktok"))
    return "videocam-outline";
  if (pkg.includes("spotify") || name.includes("spotify"))
    return "musical-notes-outline";
  if (pkg.includes("netflix") || name.includes("netflix"))
    return "film-outline";
  if (pkg.includes("telegram") || name.includes("telegram"))
    return "paper-plane-outline";
  if (pkg.includes("reddit") || name.includes("reddit")) return "logo-reddit";
  if (pkg.includes("snapchat") || name.includes("snapchat"))
    return "camera-reverse-outline";
  if (
    pkg.includes("gmail") ||
    pkg.includes("googlemail") ||
    name.includes("gmail")
  )
    return "mail-outline";
  if (pkg.includes("maps") || name.includes("maps")) return "location-outline";
  if (pkg.includes("linkedin") || name.includes("linkedin"))
    return "business-outline";
  if (pkg.includes("slack") || name.includes("slack")) return "logo-slack";
  if (pkg.includes("discord") || name.includes("discord"))
    return "game-controller-outline";
  if (pkg.includes("amazon") || name.includes("shopping"))
    return "cart-outline";
  if (
    pkg.includes("banking") ||
    pkg.includes("finance") ||
    pkg.includes("wallet")
  )
    return "wallet-outline";
  if (pkg.includes("calendar") || name.includes("calendar"))
    return "calendar-outline";
  if (pkg.includes("notes") || name.includes("notes")) return "create-outline";
  return "apps-outline";
}

function getAppGradient(
  packageName: string,
  appName: string,
): [string, string, ...string[]] {
  const pkg = packageName.toLowerCase();
  const name = appName.toLowerCase();
  if (pkg.includes("instagram") || name.includes("instagram"))
    return ["#E1306C", "#C13584", "#833AB4"];
  if (pkg.includes("youtube") || name.includes("youtube"))
    return ["#FF0000", "#CC0000"];
  if (pkg.includes("twitter") || pkg.includes("x.") || name.includes("twitter"))
    return ["#1DA1F2", "#0C6DB5"];
  if (pkg.includes("whatsapp") || name.includes("whatsapp"))
    return ["#25D366", "#128C7E"];
  if (pkg.includes("chrome") || name.includes("chrome"))
    return ["#4285F4", "#34A853"];
  if (pkg.includes("facebook") || name.includes("facebook"))
    return ["#1877F2", "#1565d8"];
  if (pkg.includes("tiktok") || name.includes("tiktok"))
    return ["#010101", "#69C9D0"];
  if (pkg.includes("spotify") || name.includes("spotify"))
    return ["#1DB954", "#159345"];
  if (pkg.includes("netflix") || name.includes("netflix"))
    return ["#E50914", "#B20710"];
  if (pkg.includes("telegram") || name.includes("telegram"))
    return ["#0088CC", "#006699"];
  return [Colors.SteelBlue, PRIMARY_CONTAINER];
}

function buildBarData(
  hourBreakdown: number[],
  period: "today" | "week",
): number[] {
  if (period === "week") return hourBreakdown.slice(0, 9);
  const hours = hourBreakdown.slice(8, 17);
  if (hours.length === 0) return new Array(9).fill(0);
  const max = Math.max(...hours, 1);
  return hours.map((h) => Math.round((h / max) * 100));
}

function buildBarLabels(period: "today" | "week"): string[] {
  if (period === "today")
    return ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm", "9pm", "10pm"];
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

function getCategoryForApp(pkg: string): string {
  const p = pkg.toLowerCase();
  if (
    p.includes("instagram") ||
    p.includes("whatsapp") ||
    p.includes("twitter") ||
    p.includes("facebook") ||
    p.includes("telegram") ||
    p.includes("snapchat") ||
    p.includes("reddit")
  )
    return "social";
  if (
    p.includes("youtube") ||
    p.includes("netflix") ||
    p.includes("spotify") ||
    p.includes("tiktok")
  )
    return "entertainment";
  if (p.includes("game") || p.includes("discord")) return "games";
  return "other";
}

const DEMO_APPS: AppUsage[] = [
  {
    packageName: "com.instagram.android",
    appName: "Instagram",
    totalTimeMs: 47 * 60 * 1000,
    lastTimeUsed: Date.now() - 600000,
  },
  {
    packageName: "com.google.android.youtube",
    appName: "YouTube",
    totalTimeMs: 38 * 60 * 1000,
    lastTimeUsed: Date.now() - 1800000,
    dailyLimitMs: 60 * 60 * 1000,
  },
  {
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    totalTimeMs: 29 * 60 * 1000,
    lastTimeUsed: Date.now() - 300000,
  },
  {
    packageName: "com.google.android.chrome",
    appName: "Chrome",
    totalTimeMs: 22 * 60 * 1000,
    lastTimeUsed: Date.now() - 900000,
  },
  {
    packageName: "com.twitter.android",
    appName: "Twitter",
    totalTimeMs: 18 * 60 * 1000,
    lastTimeUsed: Date.now() - 3600000,
  },
  {
    packageName: "com.spotify.music",
    appName: "Spotify",
    totalTimeMs: 14 * 60 * 1000,
    lastTimeUsed: Date.now() - 7200000,
  },
  {
    packageName: "com.snapchat.android",
    appName: "Snapchat",
    totalTimeMs: 11 * 60 * 1000,
    lastTimeUsed: Date.now() - 5400000,
  },
  {
    packageName: "com.facebook.katana",
    appName: "Facebook",
    totalTimeMs: 9 * 60 * 1000,
    lastTimeUsed: Date.now() - 10800000,
    dailyLimitMs: 30 * 60 * 1000,
  },
  {
    packageName: "com.netflix.mediaclient",
    appName: "Netflix",
    totalTimeMs: 45 * 60 * 1000,
    lastTimeUsed: Date.now() - 14400000,
    dailyLimitMs: 60 * 60 * 1000,
  },
  {
    packageName: "com.telegram.messenger",
    appName: "Telegram",
    totalTimeMs: 7 * 60 * 1000,
    lastTimeUsed: Date.now() - 600000,
  },
];

function generateDemoHourBreakdown(): number[] {
  const hours = new Array(24).fill(0);
  hours[8] = 12;
  hours[9] = 18;
  hours[10] = 25;
  hours[11] = 30;
  hours[12] = 22;
  hours[13] = 15;
  hours[14] = 28;
  hours[15] = 35;
  hours[16] = 40;
  hours[17] = 32;
  hours[18] = 20;
  hours[19] = 15;
  hours[20] = 10;
  hours[21] = 8;
  return hours.map((v) => v * 60 * 1000);
}

function generateDemoWeeklyReport(): {
  dailyTotals: { date: string; totalMs: number }[];
  weekTotalMs: number;
} {
  const dailyMs = [185, 210, 175, 230, 195, 260, 155].map((m) => m * 60 * 1000);
  const dailyTotals = dailyMs.map((totalMs, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d.toISOString().slice(0, 10), totalMs };
  });
  return { dailyTotals, weekTotalMs: dailyMs.reduce((a, b) => a + b, 0) };
}

export default function ScreenTimeDashboardScreen() {
  return (
    <ScreenTimeErrorBoundary>
      <ScreenTimeContent />
    </ScreenTimeErrorBoundary>
  );
}

function ScreenTimeContent() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const focusAndBlockingGate = getPremiumFeatureGate(
    "focusAndBlocking",
    isPremium,
  );
  const focusSessionsGate = getPremiumFeatureGate("focusSessions", isPremium);
  const appBlockingGate = getPremiumFeatureGate("appBlocking", isPremium);
  const [period, setPeriod] = useState<"today" | "week">("today");
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const [useDemoData, setUseDemoData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ScreenTimeReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<{
    dailyTotals: { date: string; totalMs: number }[];
    weekTotalMs: number;
  } | null>(null);
  const [yesterdayMs, setYesterdayMs] = useState<number>(0);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [focusMinutesRemaining, setFocusMinutesRemaining] = useState(42);
  const [blockedApps, setBlockedApps] = useState<Record<string, boolean>>({});

  const insets = useSafeAreaInsets();

  const loadDemoData = React.useCallback(() => {
    const demoReport: ScreenTimeReport = {
      totalMs: DEMO_APPS.reduce((sum, a) => sum + a.totalTimeMs, 0),
      apps: DEMO_APPS,
      hourBreakdown: generateDemoHourBreakdown(),
    };
    setReport(demoReport);
    const demoWeekly = generateDemoWeeklyReport();
    setWeeklyReport(demoWeekly);
    if (demoWeekly.dailyTotals.length >= 2) {
      setYesterdayMs(
        demoWeekly.dailyTotals[demoWeekly.dailyTotals.length - 2].totalMs,
      );
    }
    setPermissionGranted(true);
    setUseDemoData(true);
    setLoading(false);
  }, []);

  const loadData = React.useCallback(async () => {
    if (useDemoData) {
      loadDemoData();
      return;
    }
    const granted = await hasScreenTimePermission();
    setPermissionGranted(granted);
    if (!granted) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const screenTimeReport = await getScreenTimeReport(period);
      setReport(screenTimeReport);
      if (period === "today") {
        const weekly = await getWeeklyReport();
        setWeeklyReport(weekly);
        if (weekly && weekly.dailyTotals.length >= 2) {
          setYesterdayMs(
            weekly.dailyTotals[weekly.dailyTotals.length - 2].totalMs,
          );
        }
      } else {
        const weekly = await getWeeklyReport();
        setWeeklyReport(weekly);
        setYesterdayMs(0);
      }
    } catch {
      setReport(null);
      setWeeklyReport(null);
    }
    setLoading(false);
  }, [period, useDemoData, loadDemoData]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (!useDemoData) {
          void loadData();
        }
      });

      return () => {
        task.cancel();
      };
    }, [loadData, useDemoData]),
  );

  const handleStartFocus = () => {
    setFocusModeActive(true);
    setFocusMinutesRemaining(42);
  };

  const handlePremiumUpgrade = () => {
    router.push('/premium' as any);
  };

  const endFocusMode = () => {
    Alert.alert(
      "End Focus Mode?",
      "Are you sure you want to end your focus session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => setFocusModeActive(false),
        },
      ],
    );
  };

  const toggleBlockedApp = (pkg: string) => {
    setBlockedApps((prev) => ({ ...prev, [pkg]: !prev[pkg] }));
  };

  if (Platform.OS === "android" && permissionGranted === false) {
    return <PermissionGate onPermissionGranted={loadData} />;
  }
  if (Platform.OS !== "android" && !useDemoData) {
    return <PermissionGate onPermissionGranted={loadDemoData} />;
  }

  if (loading || !report) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Screen Time</Text>
            <Text style={styles.subtitle}>{getDateString()}</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.SteelBlue} />
          <Text style={styles.loadingText}>Loading screen time data…</Text>
        </View>
      </View>
    );
  }

  const totalTime =
    period === "week" && weeklyReport
      ? formatMs(weeklyReport.weekTotalMs)
      : formatMs(report.totalMs);
  const todayMs = report.totalMs;
  const diffMs = todayMs - yesterdayMs;
  const diffMinutes = Math.round(Math.abs(diffMs) / 60000);
  const isTrendUp = diffMs > 0;
  const trendMinutes = `${diffMs > 0 ? "+" : ""}${diffMinutes} min`;

  const barData = buildBarData(report.hourBreakdown, period);
  const barLabels = buildBarLabels(period);

  const weeklyBarData =
    period === "week" && weeklyReport
      ? (() => {
          const totals = weeklyReport.dailyTotals.map((d) => d.totalMs);
          const max = Math.max(...totals, 1);
          return totals.map((t) => Math.round((t / max) * 100));
        })()
      : null;

  const topApps: AppUsage[] = report.apps.slice(0, 10);
  const activeLimitCount = report.apps.filter(
    (app) => (app.dailyLimitMs ?? 0) > 0,
  ).length;

  const getCategoryUsage = (categoryKey: string) => {
    const apps = topApps.filter(
      (a) => getCategoryForApp(a.packageName) === categoryKey,
    );
    const totalMs = apps.reduce((sum, a) => sum + a.totalTimeMs, 0);
    const limitMs =
      apps.reduce((sum, a) => sum + (a.dailyLimitMs || 0), 0) ||
      apps.length * 60 * 60 * 1000;
    return { apps, totalMs, limitMs };
  };

  const getLimitColor = (pct: number): string => {
    if (pct >= 1) return Colors.Danger;
    if (pct >= 0.75) return Colors.Warning;
    if (pct >= 0.5) return Colors.SteelBlue;
    return Colors.Success;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {focusModeActive && (
        <View style={styles.focusBanner}>
          <View style={styles.focusBannerContent}>
            <Ionicons name="eye-off-outline" size={18} color={Colors.Surface} />
            <Text style={styles.focusBannerText}>
              Focus Mode — {focusMinutesRemaining} min remaining
            </Text>
          </View>
          <Pressable onPress={endFocusMode} style={styles.focusBannerEnd}>
            <Text style={styles.focusBannerEndText}>End</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Screen Time</Text>
          <Text style={styles.subtitle}>{getDateString()}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodToggle}>
          <Pressable
            onPress={() => setPeriod("today")}
            style={[
              styles.periodBtn,
              period === "today" && styles.periodBtnActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === "today" && styles.periodTextActive,
              ]}
            >
              Today
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPeriod("week")}
            style={[
              styles.periodBtn,
              period === "week" && styles.periodBtnActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === "week" && styles.periodTextActive,
              ]}
            >
              Week
            </Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroValue}>{totalTime}</Text>
              {yesterdayMs > 0 && (
                <View
                  style={[
                    styles.trendChip,
                    isTrendUp
                      ? styles.trendChipWarning
                      : styles.trendChipSuccess,
                  ]}
                >
                  <Ionicons
                    name={isTrendUp ? "trending-up" : "trending-down"}
                    size={14}
                    color={isTrendUp ? Colors.Danger : Colors.Success}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      isTrendUp
                        ? styles.trendTextWarning
                        : styles.trendTextSuccess,
                    ]}
                  >
                    {trendMinutes} vs{" "}
                    {period === "today" ? "yesterday" : "last week"}
                  </Text>
                </View>
              )}
            </View>
            <AnimatedPressable style={styles.timerIconBox}>
              <Ionicons
                name="timer-outline"
                size={28}
                color={Colors.SteelBlue}
              />
            </AnimatedPressable>
          </View>
        </View>

        <View style={styles.categoryCardsRow}>
          {APP_CATEGORIES.map((cat) => {
            const usage = getCategoryUsage(cat.key);
            const pct =
              usage.limitMs > 0
                ? Math.min(usage.totalMs / usage.limitMs, 1)
                : 0;
            const color = getLimitColor(pct);

            return (
              <View key={cat.key} style={styles.categoryCard}>
                <View style={styles.categoryRingWrapper}>
                  <View
                    style={[
                      styles.categoryRingBg,
                      { borderColor: cat.color + "30" },
                    ]}
                  />
                  <View
                    style={[
                      styles.categoryRingFill,
                      {
                        borderColor: color,
                        borderTopWidth: 3,
                        borderRightWidth: pct > 0.25 ? 3 : 0,
                        borderBottomWidth: pct > 0.5 ? 3 : 0,
                        borderLeftWidth: pct > 0.75 ? 3 : 0,
                      },
                    ]}
                  />
                  <Ionicons name={cat.icon} size={24} color={cat.color} />
                </View>
                <Text
                  style={styles.categoryCardLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {cat.label}
                </Text>
                <Text style={styles.categoryCardTime}>
                  {formatMs(usage.totalMs)}
                </Text>
                <Text style={styles.categoryCardLimit}>
                  {pct >= 1
                    ? "At limit"
                    : pct >= 0.75
                      ? "Approaching limit"
                      : pct >= 0.5
                        ? "Halfway to limit"
                        : "Within limit"}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Hourly Activity</Text>
            <Text style={styles.peakLabel}>
              {period === "today"
                ? `Peak: ${findPeakHour(report.hourBreakdown)}`
                : `${period} total`}
            </Text>
          </View>
          <View style={styles.chartBars}>
            {(period === "week" && weeklyBarData ? weeklyBarData : barData).map(
              (height, i) => {
                const opacity = 0.2 + (Math.max(height, 1) / 100) * 0.8;
                return (
                  <View key={i} style={styles.chartBarColumn}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${Math.max(height, 2)}%`,
                          backgroundColor: Colors.SteelBlue,
                          opacity,
                        },
                      ]}
                    />
                  </View>
                );
              },
            )}
          </View>
          <View style={styles.chartLabels}>
            {(period === "week"
              ? barLabels.filter((_, i) => {
                  const step = Math.max(1, Math.floor(7 / 4));
                  return i % step === 0 || i === 6;
                })
              : barLabels.filter((_, i) => {
                  const step = Math.floor(barLabels.length / 4);
                  return i % step === 0 || i === barLabels.length - 1;
                })
            ).map((label, i) => (
              <Text key={i} style={styles.chartLabel}>
                {label}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.appsHeader}>
          <Text style={styles.appsHeaderTitle}>Most Used Apps</Text>
        </View>

        {topApps.map((app: AppUsage, index: number) => {
          const pct = getLimitPercent(app.totalTimeMs, app.dailyLimitMs);
          const limitReached = isLimitReached(
            app.totalTimeMs,
            app.dailyLimitMs,
          );
          const timeLeftMs = app.dailyLimitMs
            ? app.dailyLimitMs - app.totalTimeMs
            : undefined;
          const timeLeftMinutes =
            timeLeftMs !== undefined && timeLeftMs > 0
              ? Math.round(timeLeftMs / 60000)
              : undefined;
          const ionicon = getAppIcon(app.packageName, app.appName);
          const gradientColors = getAppGradient(app.packageName, app.appName);
          const isBlocked = !!blockedApps[app.packageName];

          return (
            <View key={index} style={styles.appCard}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.appIcon, isBlocked && styles.appIconBlocked]}
              >
                <Ionicons
                  name={ionicon}
                  size={22}
                  color={isBlocked ? Colors.TextSecondary : Colors.Surface}
                />
              </LinearGradient>
              <View style={styles.appInfo}>
                <View style={styles.appHeader}>
                  <View style={styles.appNameCol}>
                    <Text
                      style={[
                        styles.appName,
                        isBlocked && styles.appNameBlocked,
                      ]}
                    >
                      {app.appName}
                    </Text>
                    <Text style={styles.appTime}>
                      {formatMs(app.totalTimeMs)}{" "}
                    </Text>
                  </View>
                  {limitReached ? (
                    <View style={styles.limitBadge}>
                      <Text style={styles.limitBadgeText}>Limit Reached</Text>
                    </View>
                  ) : timeLeftMinutes !== undefined && timeLeftMinutes > 0 ? (
                    <Text style={styles.timeRemaining}>
                      {timeLeftMinutes}m left
                    </Text>
                  ) : null}
                </View>
                {app.dailyLimitMs !== undefined && app.dailyLimitMs > 0 && (
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${pct * 100}%`,
                          backgroundColor: limitReached
                            ? Colors.Danger
                            : pct >= 0.7
                              ? Colors.Warning
                              : Colors.SteelBlue,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <LinearGradient
          colors={[Colors.SteelBlue, Colors.TextPrimary]}
          style={styles.focusCard}
        >
          {focusAndBlockingGate.locked && (
            <View style={styles.focusBannerWrap}>
              <PremiumLockedBanner
                featureName={focusAndBlockingGate.featureName}
                onUpgrade={handlePremiumUpgrade}
              />
            </View>
          )}
          <View style={styles.focusContent}>
            <View style={styles.focusHeader}>
              <Ionicons name="cellular" size={24} color={Colors.SoftSky} />
              <Text style={styles.focusTitle}>Set Focus Session</Text>
            </View>
            <Text style={styles.focusDescription}>
              Lock distractions and boost your productivity flow instantly.
            </Text>
            <View style={styles.focusButtonsRow}>
              {FOCUS_DURATIONS.map((duration) => (
                <AnimatedPressable
                  key={duration.label}
                  style={styles.focusBtn}
                  onPress={
                    focusSessionsGate.locked
                      ? handlePremiumUpgrade
                      : handleStartFocus
                  }
                >
                  <Text style={styles.focusBtnLabel}>{duration.label}</Text>
                  <Text style={styles.focusBtnUnit}>{duration.unit}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
          <View style={styles.decoCircle} />
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color={Colors.TextSecondary}
          />
          <Text style={styles.sectionHeaderText}>Blocked Apps</Text>
        </View>
        <View style={styles.blockedAppsContainer}>
          {topApps.slice(0, 6).map((app, index) => {
            const isBlocked = !!blockedApps[app.packageName];
            const ionicon = getAppIcon(app.packageName, app.appName);
            const gradientColors = getAppGradient(app.packageName, app.appName);
            return (
              <View key={index} style={styles.blockedAppRow}>
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.blockedAppIcon,
                    isBlocked && styles.appIconBlocked,
                  ]}
                >
                  <Ionicons
                    name={ionicon}
                    size={18}
                    color={isBlocked ? Colors.TextSecondary : Colors.Surface}
                  />
                </LinearGradient>
                <Text
                  style={[
                    styles.blockedAppName,
                    isBlocked && styles.appNameBlocked,
                  ]}
                >
                  {app.appName}
                </Text>
                <Switch
                  value={isBlocked}
                  onValueChange={() => {
                    if (!appBlockingGate.locked) {
                      toggleBlockedApp(app.packageName);
                      return;
                    }

                    handlePremiumUpgrade();
                  }}
                  trackColor={{
                    false: Colors.BorderSubtle,
                    true: Colors.Danger + "80",
                  }}
                  thumbColor={isBlocked ? Colors.Danger : Colors.Surface}
                />
              </View>
            );
          })}
        </View>

        <AnimatedPressable
          style={styles.manageLimits}
          onPress={() => router.push("/(tabs)/screen-time/manage-limits" as any)}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={Colors.SteelBlue}
          />
          <View style={styles.manageLimitsCopy}>
            <Text style={styles.manageLimitsText}>Manage App Limits</Text>
            <Text style={styles.manageLimitsMeta}>
              {activeLimitCount > 0
                ? `${activeLimitCount} active limit${activeLimitCount === 1 ? "" : "s"}`
                : "No limits set"}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.TextSecondary}
          />
        </AnimatedPressable>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

function findPeakHour(hourBreakdown: number[]): string {
  let maxMs = 0;
  let peakHour = 12;
  for (let i = 0; i < hourBreakdown.length; i++) {
    if (hourBreakdown[i] > maxMs) {
      maxMs = hourBreakdown[i];
      peakHour = i;
    }
  }
  const suffix = peakHour >= 12 ? "pm" : "am";
  const display =
    peakHour > 12 ? peakHour - 12 : peakHour === 0 ? 12 : peakHour;
  return `${display}${suffix}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.Background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    ...Typography.Body2,
    color: Colors.TextSecondary,
    marginTop: Spacing.md,
  },
  title: {
    ...Typography.Headline1,
    color: Colors.TextPrimary,
    fontWeight: "700",
  },
  subtitle: { ...Typography.Body2, color: Colors.TextSecondary, marginTop: 2 },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  focusBanner: {
    backgroundColor: Colors.TextPrimary,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  focusBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  focusBannerText: {
    ...Typography.Body2,
    color: Colors.Surface,
    fontWeight: "600",
  },
  focusBannerEnd: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Shapes.Badge,
    backgroundColor: Colors.Danger + "30",
  },
  focusBannerEndText: {
    ...Typography.Caption,
    color: Colors.Surface,
    fontWeight: "700",
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: Colors.WarmSand,
    borderRadius: 12,
    padding: 2,
    marginBottom: Spacing.xs,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: 10,
  },
  periodBtnActive: {
    backgroundColor: Colors.Surface,
    shadowColor: Colors.TextPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  periodText: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  periodTextActive: { color: Colors.SteelBlue },
  heroCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.HeroCard,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    ...Shadows.HeroCard,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: { flex: 1 },
  heroValue: {
    ...Typography.Stat,
    color: Colors.SteelBlue,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.Badge,
    alignSelf: "flex-start",
  },
  trendChipWarning: { backgroundColor: Colors.Danger + "15" },
  trendChipSuccess: { backgroundColor: Colors.Success + "20" },
  trendText: {
    ...Typography.Caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  trendTextWarning: { color: Colors.Danger },
  trendTextSuccess: { color: Colors.Success },
  timerIconBox: {
    width: 56,
    height: 56,
    backgroundColor: Colors.SteelBlue + "18",
    borderRadius: Shapes.IconBg,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    alignItems: "flex-start",
    ...Shadows.Card,
  },
  categoryRingWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
    position: "relative",
  },
  categoryRingBg: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
  categoryRingFill: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 0,
  },
  categoryCardLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "600",
    letterSpacing: 0,
    marginBottom: 2,
    width: "100%",
  },
  categoryCardTime: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "600",
    marginTop: 2,
  },
  categoryCardLimit: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.HeroCard,
    padding: Spacing.lg,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: "uppercase",
  },
  peakLabel: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    fontStyle: "italic",
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 128,
    paddingHorizontal: 4,
  },
  chartBarColumn: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    marginHorizontal: 2,
    backgroundColor: Colors.WarmSand,
  },
  chartBar: { width: "100%", borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
  },
  chartLabel: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
    fontWeight: "500",
    opacity: 0.6,
    textTransform: "uppercase",
  },
  appsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  appsHeaderTitle: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: "uppercase",
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.HeroCard,
    padding: Spacing.md + 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appIconBlocked: { opacity: 0.4 },
  appInfo: { flex: 1 },
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  appNameCol: { flex: 1 },
  appName: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: "700",
  },
  appNameBlocked: {
    color: Colors.TextSecondary,
    textDecorationLine: "line-through",
  },
  appTime: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  limitBadge: {
    backgroundColor: Colors.Danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Shapes.Badge,
  },
  limitBadgeText: {
    ...Typography.Micro,
    color: Colors.Surface,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timeRemaining: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Chip,
    overflow: "hidden",
    marginTop: 4,
  },
  progressBarFill: { height: "100%", borderRadius: Shapes.Chip },
  focusCard: {
    borderRadius: Shapes.HeroCard,
    padding: Spacing.lg,
    overflow: "hidden",
    position: "relative",
  },
  focusBannerWrap: {
    marginBottom: Spacing.md,
    position: "relative",
    zIndex: 1,
  },
  focusContent: { position: "relative", zIndex: 1 },
  focusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.xs,
  },
  focusTitle: { ...Typography.Headline2, color: Colors.Surface },
  focusDescription: {
    ...Typography.Body2,
    color: Colors.Surface + "CC",
    marginBottom: Spacing.lg,
    maxWidth: 260,
  },
  focusButtonsRow: { flexDirection: "row", gap: Spacing.sm },
  focusBtn: {
    flex: 1,
    backgroundColor: Colors.Surface + "25",
    borderRadius: 16,
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  focusBtnLabel: {
    ...Typography.Headline2,
    color: Colors.Surface,
    fontWeight: "700",
  },
  focusBtnUnit: {
    ...Typography.Micro,
    color: Colors.Surface + "99",
    fontWeight: "700",
    textTransform: "uppercase",
    marginLeft: 2,
  },
  decoCircle: {
    position: "absolute",
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: Colors.WarmSand,
    opacity: 0.08,
    right: -48,
    top: -48,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionHeaderText: {
    ...Typography.SectionLabel,
    color: Colors.TextSecondary,
    textTransform: "uppercase",
  },
  blockedAppsContainer: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    marginTop: Spacing.sm,
  },
  blockedAppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderSubtle + "60",
  },
  blockedAppIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  blockedAppName: {
    ...Typography.Body2,
    color: Colors.TextPrimary,
    flex: 1,
    fontWeight: "500",
  },
  manageLimits: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderSubtle,
    marginTop: Spacing.md,
  },
  manageLimitsCopy: {
    flex: 1,
  },
  manageLimitsText: {
    ...Typography.Body1,
    color: Colors.SteelBlue,
    fontWeight: "600",
  },
  manageLimitsMeta: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    marginTop: 2,
  },
});
