import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Shapes, Spacing, Typography } from '@/constants/theme';

type UsageChartProps = {
  period: 'today' | 'week';
  barData: number[];
  weeklyBarData: number[] | null;
  barLabels: string[];
  peakLabel: string;
};

export function UsageChart({
  period,
  barData,
  weeklyBarData,
  barLabels,
  peakLabel,
}: UsageChartProps) {
  const heights = period === 'week' && weeklyBarData ? weeklyBarData : barData;
  const labels =
    period === 'week'
      ? barLabels.filter((_, i) => {
          const step = Math.max(1, Math.floor(7 / 4));
          return i % step === 0 || i === 6;
        })
      : barLabels.filter((_, i) => {
          const step = Math.floor(barLabels.length / 4);
          return i % step === 0 || i === barLabels.length - 1;
        });

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Hourly Activity</Text>
        <Text style={styles.peakLabel}>{peakLabel}</Text>
      </View>
      <View style={styles.chartBars}>
        {heights.map((height, i) => {
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
        })}
      </View>
      <View style={styles.chartLabels}>
        {labels.map((label, i) => (
          <Text key={i} style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: Colors.Surface,
    borderRadius: Shapes.Card,
    borderWidth: 1,
    borderColor: Colors.BorderSubtle,
    padding: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    ...Typography.Body1,
    color: Colors.TextPrimary,
    fontWeight: '700',
  },
  peakLabel: {
    ...Typography.Caption,
    color: Colors.TextSecondary,
  },
  chartBars: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  chartBarColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  chartLabel: {
    ...Typography.Micro,
    color: Colors.TextSecondary,
  },
});
