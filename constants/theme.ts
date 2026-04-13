// Kaarma Design System — single source of truth for all visual tokens
// Based on design.md v1.0 + Design System Enforcement pass

// ─── Colors ────────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  SteelBlue: '#81A6C6',       // Primary CTA, active states, progress rings
  SoftSky: '#AACDDC',         // Secondary highlights, hover states, gradient fills

  // Neutral / Surface
  WarmSand: '#F3E3D0',        // Accent backgrounds, journal cards, warm highlights
  DustyTaupe: '#D2C4B4',      // Borders, dividers, inactive states

  // Semantic Surfaces
  Background: '#FAFAF8',      // App background (warm off-white, never stark white)
  Surface: '#FFFFFF',         // Card backgrounds, bottom sheets, modals
  BorderSubtle: '#E8E4DF',    // Card borders

  // Elevated Surfaces (warm neutral tones)
  SurfaceContainerLowest: '#FFFFFF',
  SurfaceContainerLow: '#F8F3EB',
  SurfaceContainer: '#F2EDE5',
  SurfaceContainerHigh: '#ECE8DF',
  SurfaceContainerHighest: '#E6E2DA',

  // Semantic Text
  TextPrimary: '#1A1A2E',      // Never use pure black #000000
  TextSecondary: '#5A5A72',
  TextMuted: '#757681',        // Tertiary / placeholder text

  // Status
  Success: '#4CAF82',         // Streaks, completed states
  Warning: '#F5A623',          // At-risk, approaching limits
  Danger: '#E05C5C',          // Relapse, blocked, destructive

  // Overlay
  OverlayLight: 'rgba(0,0,0,0.35)',
  OverlayMedium: 'rgba(26,26,46,0.6)',
} as const;

// ─── Dark Mode Colors ──────────────────────────────────────────────────────

export const DarkColors = {
  Background: '#0F0F1A',
  Surface: '#1C1C2E',
  TextPrimary: '#F0F0F8',
  TextSecondary: '#9090A8',
  SteelBlue: '#81A6C6',
  SoftSky: '#AACDDC',
  DustyTaupe: '#3A3A4E',
  WarmSand: '#2A2218',
  BorderSubtle: '#2A2A3E',
  Success: '#4CAF82',
  Warning: '#F5A623',
  Danger: '#E05C5C',
  TextMuted: '#6A6A82',
  SurfaceContainerLowest: '#0A0A14',
  SurfaceContainerLow: '#14142A',
  SurfaceContainer: '#1C1C2E',
  SurfaceContainerHigh: '#262640',
  SurfaceContainerHighest: '#303050',
  OverlayLight: 'rgba(0,0,0,0.5)',
  OverlayMedium: 'rgba(0,0,0,0.75)',
} as const;

// ─── Spacing (base 4dp) ─────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,                       // Icon padding, tight gaps
  sm: 8,                       // Between related elements
  md: 16,                      // Card internal padding
  lg: 24,                      // Between sections
  xl: 32,                      // Major section separation
  xxl: 48,                     // Hero section padding
  screenH: 20,                 // Screen horizontal margin — 20dp on all screens
} as const;

// ─── Typography (Inter font family) ─────────────────────────────────────────

export const Typography = {
  Display: {
    fontSize: 32,
    fontWeight: '900' as const,
    fontFamily: 'Inter-Black',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  Headline1: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: 'Inter-Bold',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  Headline2: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter-Bold',
    lineHeight: 28,
    letterSpacing: 0,
  },
  BodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    letterSpacing: 0,
  },
  Body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    letterSpacing: 0,
  },
  Body2: {
    fontSize: 15,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: 0,
  },
  Caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    lineHeight: 16,
    letterSpacing: 0.8,
  },
  Micro: {
    fontSize: 10,
    fontWeight: '400' as const,
    fontFamily: 'Inter-Regular',
    lineHeight: 14,
    letterSpacing: 0,
  },
  Stat: {
    fontSize: 36,
    fontWeight: '800' as const,
    fontFamily: 'Inter-ExtraBold',
    lineHeight: 44,
    letterSpacing: -1,
  },
  SectionLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: 'Inter-Medium',
    lineHeight: 16,
    letterSpacing: 0.8,
  },
} as const;

// ─── Shapes (corner radii) ─────────────────────────────────────────────────

export const Shapes = {
  Card: 16,
  HeroCard: 20,
  Button: 12,
  PillButton: 9999,
  Chip: 8,
  Badge: 9999,
  Input: 12,
  BottomSheet: 24,
  BottomNav: 20,
  IconBg: 12,
  Dialog: 16,
  FAB: 9999,
  QuickAction: 9999,
} as const;

// ─── Shadow presets ────────────────────────────────────────────────────────

export const Shadows = {
  Card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  HeroCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  FAB: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 6,
  },
  Modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  BottomNav: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  QuickAction: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

// ─── Animation Timings ──────────────────────────────────────────────────────

export const Animation = {
  screenTransition: 280,
  cardTap: 100,
  habitToggle: 300,
  streakAppear: 400,
  progressRing: 600,
  fabExpand: 350,
  bottomSheet: 320,
  relapseConfirm: 250,
  easing: {
    easeOutCubic: 'cubic-bezier(0.33, 1, 0.68, 1)' as const,
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)' as const,
    spring: { damping: 0.6, stiffness: 100 } as const,
  },
} as const;

// ─── Navigation Bar ─────────────────────────────────────────────────────────

export const NavBar = {
  height: 64,
  activeColor: Colors.SteelBlue,
  inactiveColor: Colors.DustyTaupe,
  backgroundColor: Colors.Surface,
  activeIndicatorBg: Colors.SoftSky + '4D',
  FABColor: Colors.TextPrimary,
} as const;

// ─── Combined Theme Object ──────────────────────────────────────────────────

export const theme = {
  Colors,
  DarkColors,
  Spacing,
  Typography,
  Shapes,
  Shadows,
  Animation,
  NavBar,
} as const;

export type ThemeType = typeof theme;