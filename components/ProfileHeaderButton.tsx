import { Colors, Spacing } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

/** Compact profile affordance matching the Home header avatar pattern. */
export function ProfileHeaderButton() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/profile' as any)}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      style={({ pressed }) => [
        styles.avatar,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Ionicons name="person" size={20} color={Colors.SteelBlue} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.SteelBlue,
    backgroundColor: Colors.SoftSky + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
});

export default ProfileHeaderButton;
