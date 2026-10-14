import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTracker } from '../context/TrackerContext';
import { Timeframe } from '../types';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { ActivitySparkline } from '../components/ActivitySparkline';
import { CategoryBreakdown } from '../components/CategoryBreakdown';
import { computeChartData } from '../db/database';
import { triggerHaptic } from '../utils/haptics';

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

export const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { entries, stats, categoryStats, settings } = useTracker();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');

  const chartData = computeChartData(entries, timeframe);

  const handleTimeframeChange = (tf: Timeframe) => {
    triggerHaptic('selection');
    setTimeframe(tf);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 100 },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenEyebrow}>ACTIVITY METRICS</Text>
            <Text style={styles.screenTitle}>Analytics</Text>
          </View>
        </View>

        {/* Timeframe Selector Pill Group */}
        <View style={styles.timeframeSegment}>
          {TIMEFRAMES.map((item) => {
            const isSelected = timeframe === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => handleTimeframeChange(item.key)}
                style={[
                  styles.segmentButton,
                  isSelected && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Distance Trajectory Chart Card */}
        <GlassCard style={styles.chartCard} borderHighlight glowColor="rgba(0, 242, 254, 0.15)">
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Distance Overview</Text>
              <Text style={styles.chartSubtitle}>
                {timeframe === 'week'
                  ? 'Last 7 days daily volume'
                  : timeframe === 'month'
                  ? 'Weekly volume this month'
                  : 'Last 6 months volume'}
              </Text>
            </View>
          </View>

          <ActivitySparkline
            data={chartData}
            unit={settings.unit}
            height={140}
            barColor="rgba(0, 242, 254, 0.5)"
            gradientCap="#00F2FE"
          />
        </GlassCard>

        {/* Personal Records Cards */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionHeader}>Journey Records</Text>

          <View style={styles.recordsGrid}>
            <GlassCard style={styles.recordCard}>
              <View style={[styles.recordIconWrap, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="trophy-outline" size={18} color="#FBBF24" />
              </View>
              <Text style={styles.recordLabel}>LONGEST TRIP</Text>
              <Text style={styles.recordValue}>
                {stats.longestTrip} <Text style={styles.recordUnit}>{settings.unit}</Text>
              </Text>
            </GlassCard>

            <GlassCard style={styles.recordCard}>
              <View style={[styles.recordIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="navigate-outline" size={18} color="#10B981" />
              </View>
              <Text style={styles.recordLabel}>TOTAL JOURNEYS</Text>
              <Text style={styles.recordValue}>
                {stats.totalTrips} <Text style={styles.recordUnit}>trips</Text>
              </Text>
            </GlassCard>

            <GlassCard style={styles.recordCard}>
              <View style={[styles.recordIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Ionicons name="analytics-outline" size={18} color="#A855F7" />
              </View>
              <Text style={styles.recordLabel}>AVERAGE TRIP</Text>
              <Text style={styles.recordValue}>
                {stats.averageTrip} <Text style={styles.recordUnit}>{settings.unit}</Text>
              </Text>
            </GlassCard>
          </View>
        </View>

        {/* Category Breakdown Section */}
        <GlassCard style={styles.sectionMargin}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Movement Breakdown</Text>
            <Text style={styles.cardSubtitle}>Distribution by activity type</Text>
          </View>

          <CategoryBreakdown stats={categoryStats} unit={settings.unit} />
        </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    marginBottom: 16,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  timeframeSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  segmentTextActive: {
    color: '#00F2FE',
    fontWeight: '800',
  },
  chartCard: {
    marginBottom: 18,
    borderRadius: 22,
  },
  chartHeaderRow: {
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  sectionMargin: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  recordsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  recordCard: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
  },
  recordIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  recordUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
