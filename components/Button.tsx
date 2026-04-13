import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, Typography, Shapes, Shadows } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((num >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((num >> 8) & 0xff) * (1 - amount));
  const b = Math.round((num & 0xff) * (1 - amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; text: string }> = {
  primary: { bg: Colors.SteelBlue, text: Colors.Surface },
  secondary: { bg: 'transparent', text: Colors.SteelBlue },
  danger: { bg: Colors.Danger, text: Colors.Surface },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const isOutline = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: VARIANT_COLORS[variant].bg },
        isOutline && styles.secondaryOutline,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && {
          backgroundColor: isOutline
            ? Colors.SteelBlue + '12'
            : darkenColor(VARIANT_COLORS[variant].bg, 0.1),
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline ? Colors.SteelBlue : Colors.Surface}
        />
      ) : (
        <View style={styles.labelRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={disabled ? Colors.TextSecondary : VARIANT_COLORS[variant].text}
              style={styles.iconInline}
            />
          )}
          <Text
            style={[
              styles.text,
              { color: VARIANT_COLORS[variant].text },
              disabled && styles.disabledText,
              isOutline && styles.secondaryText,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}

export function FAB({ icon, onPress, disabled = false }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.fab,
        disabled && styles.disabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <Ionicons name={icon} size={24} color={Colors.Surface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Shapes.Button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryOutline: {
    borderWidth: 1.5,
    borderColor: Colors.SteelBlue,
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconInline: {
    marginRight: Spacing.xs,
  },
  text: {
    ...Typography.Body1,
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryText: {
    color: Colors.SteelBlue,
  },
  disabledText: {
    color: Colors.TextSecondary,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: Shapes.FAB,
    backgroundColor: Colors.TextPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.FAB,
  },
});

export default Button;