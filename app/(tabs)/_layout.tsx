import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { StackActions } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Shadows, Shapes, Spacing } from "../../constants/theme";

type TabConfig = {
  name: string;
  label: string;
  icon: string;
  iconFocused: string;
};

const TABS: TabConfig[] = [
  { name: "index", label: "Home", icon: "home-outline", iconFocused: "home" },
  {
    name: "habits",
    label: "Habits",
    icon: "checkmark-done-outline",
    iconFocused: "checkmark-done",
  },
  {
    name: "track",
    label: "Track",
    icon: "layers-outline",
    iconFocused: "layers",
  },
  { name: "goals", label: "Goals", icon: "flag-outline", iconFocused: "flag" },
  {
    name: "screen-time",
    label: "Time",
    icon: "time-outline",
    iconFocused: "time",
  },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.barOuter,
        {
          paddingBottom: insets.bottom + Spacing.xs,
          bottom: 0,
          left: 0,
          right: 0,
        },
      ]}
    >
      <View style={styles.bar}>
        {TABS.map((tab, index) => {
          const isActive = state.index === index;

          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                if (state.index === index) {
                  const route = state.routes[index];
                  if (
                    route.state &&
                    route.state.index != null &&
                    route.state.index > 0
                  ) {
                    navigation.dispatch({
                      ...StackActions.popToTop(),
                      target: route.state.key,
                    });
                  }
                } else {
                  navigation.navigate(tab.name as never);
                }
              }}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={isActive ? { selected: true } : undefined}
              accessibilityLabel={tab.label}
            >
              <View style={styles.tabInner}>
                {isActive && <View style={styles.activeBg} />}
                <View style={styles.tabContent}>
                  <Ionicons
                    name={
                      isActive ? (tab.iconFocused as any) : (tab.icon as any)
                    }
                    size={22}
                    color={isActive ? Colors.SteelBlue : Colors.DustyTaupe}
                  />
                  <Text
                    allowFontScaling={false}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    ellipsizeMode="clip"
                    numberOfLines={1}
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="track" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="screen-time" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    position: "absolute",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  bar: {
    width: "96%",
    maxWidth: 460,
    flexDirection: "row",
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.BottomNav + 8,
    paddingHorizontal: 2,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.BottomNav,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: Spacing.xs,
    paddingHorizontal: 2,
    borderRadius: Shapes.Chip,
    position: "relative",
  },
  activeBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.SoftSky + "40",
    borderRadius: Shapes.Chip,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minWidth: 0,
    gap: 2,
    zIndex: 1,
  },
  tabLabel: {
    width: "100%",
    fontSize: 9,
    fontWeight: "500" as const,
    fontFamily: "Inter-Medium",
    lineHeight: 12,
    color: Colors.DustyTaupe,
    textAlign: "center",
    flexShrink: 1,
    includeFontPadding: false,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: Colors.SteelBlue,
    fontWeight: "700" as const,
  },
});
