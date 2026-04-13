import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, Shapes, Shadows } from '../constants/theme';

export const QUOTES: { text: string; author: string }[] = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { text: 'Motivation is what gets you started. Habit is what keeps you going.', author: 'Jim Ryun' },
  { text: 'You will never change your life until you change something you do daily.', author: 'John C. Maxwell' },
  { text: 'First we make our habits, then our habits make us.', author: 'Charles C. Nobel' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'The chain of habit is too weak to be felt until it is too strong to be broken.', author: 'Samuel Johnson' },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear' },
];

interface QuoteCardProps {
  quoteIndex?: number;
}

export function QuoteCard({ quoteIndex }: QuoteCardProps) {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = quoteIndex !== undefined ? quoteIndex : dayOfYear % QUOTES.length;
  const quote = QUOTES[index];

  return (
    <View style={styles.container}>
      <Text style={styles.text}>&ldquo;{quote.text}&rdquo;</Text>
      <Text style={styles.author}>&mdash; {quote.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.WarmSand,
    borderRadius: Shapes.Card,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.SteelBlue,
    ...Shadows.Card,
  },
  text: {
    ...Typography.BodyLarge,
    color: Colors.TextPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  author: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
    textAlign: 'right',
  },
});

export default QuoteCard;