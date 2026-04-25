import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Shapes, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  noShadow?: boolean;
  hero?: boolean;
  heroGradient?: 'blue' | 'warm';
}

function CardComponent({
  children,
  style,
  padding = Spacing.md,
  noShadow = false,
  hero = false,
  heroGradient = 'blue',
}: CardProps) {
  if (hero) {
    const gradientColors = heroGradient === 'warm'
      ? ([Colors.Surface, Colors.WarmSand] as const)
      : ([Colors.SoftSky, Colors.SteelBlue] as const);

    return (
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.heroContainer,
          { padding },
          !noShadow && styles.heroShadow,
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { padding },
        noShadow && styles.noShadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export const Card = React.memo(CardComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderColor: Colors.BorderSubtle,
    borderWidth: StyleSheet.hairlineWidth,
    ...Shadows.Card,
  },
  heroContainer: {
    borderRadius: Shapes.HeroCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.BorderSubtle + '40',
    ...Shadows.HeroCard,
  },
  heroShadow: {},
  noShadow: {
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default Card;
