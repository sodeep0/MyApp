import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Shapes, Shadows } from '../../constants/theme';

type TabConfig = {
  name: string;
  label: string;
  icon: string;
  iconFocused: string;
};

const TABS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { name: 'habits', label: 'Habits', icon: 'checkmark-done-outline', iconFocused: 'checkmark-done' },
  { name: 'track', label: 'Track', icon: 'layers-outline', iconFocused: 'layers' },
  { name: 'goals', label: 'Goals', icon: 'flag-outline', iconFocused: 'flag' },
  { name: 'screen-time', label: 'Time', icon: 'time-outline', iconFocused: 'time' },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.barOuter,
        { paddingBottom: insets.bottom + Spacing.xs, bottom: 0, left: 0, right: 0 },
      ]}
    >
      <View style={styles.bar}>
        {TABS.map((tab, index) => {
          const isActive = state.index === index;

          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(tab.name as never)}
              style={styles.tabItem}
              accessibilityRole="tab"
              accessibilityState={isActive ? { selected: true } : undefined}
              accessibilityLabel={tab.label}
            >
              <View style={styles.tabInner}>
                {isActive && <View style={styles.activeBg} />}
                <View style={styles.tabContent}>
                  <Ionicons
                    name={isActive ? (tab.iconFocused as any) : (tab.icon as any)}
                    size={22}
                    color={isActive ? Colors.SteelBlue : Colors.DustyTaupe}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
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
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ unmountOnBlur: true } as any} />
      <Tabs.Screen name="habits" options={{ unmountOnBlur: true } as any} />
      <Tabs.Screen name="track" options={{ unmountOnBlur: true } as any} />
      <Tabs.Screen name="goals" options={{ unmountOnBlur: true } as any} />
      <Tabs.Screen name="screen-time" options={{ unmountOnBlur: true } as any} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: '80%',
    flexDirection: 'row',
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.BottomNav + 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.BottomNav,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: Shapes.Chip,
    position: 'relative',
  },
  activeBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.SoftSky + '40',
    borderRadius: Shapes.Chip,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    lineHeight: 14,
    color: Colors.DustyTaupe,
  },
  tabLabelActive: {
    color: Colors.SteelBlue,
    fontWeight: '700' as const,
  },
});
