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
import { MilestoneBadge } from '../components/MilestoneBadge';
import { CelebrationModal } from '../components/CelebrationModal';
import { computeChartData } from '../db/database';
import { triggerHaptic } from '../utils/haptics';

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: 'week', label: 'Weekly' },
  { key: 'month', label: 'Monthly' },
  { key: 'year', label: 'Yearly' },
];

export const AnalyticsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { entries, stats, categoryStats, milestones, settings } = useTracker();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [testMilestone, setTestMilestone] = useState<any | null>(null);

  const chartData = computeChartData(entries, timeframe);

  const handleTimeframeChange = (tf: Timeframe) => {
    triggerHaptic('selection');
    setTimeframe(tf);
  };

  return (
    <View style={styles.container}>
      {/* Background Ambience */}
      <View style={styles.ambientGlow} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 110 },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenEyebrow}>METRICS & INSIGHTS</Text>
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

        {/* Primary Activity Chart Card */}
        <GlassCard style={styles.chartCard} borderHighlight glowColor="rgba(0, 242, 254, 0.15)">
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Distance Trajectory</Text>
              <Text style={styles.chartSubtitle}>
                {timeframe === 'week'
                  ? 'Daily recorded kilometers over the last 7 days'
                  : timeframe === 'month'
                  ? 'Weekly aggregates for the current month'
                  : 'Monthly volume across the past 6 months'}
              </Text>
            </View>
          </View>

          <ActivitySparkline
            data={chartData}
            unit={settings.unit}
            height={150}
            barColor="rgba(0, 242, 254, 0.5)"
            gradientCap="#00F2FE"
          />
        </GlassCard>

        {/* Personal Records & Highlights Grid */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionHeader}>Personal Records</Text>

          <View style={styles.recordsGrid}>
            <GlassCard style={styles.recordCard}>
              <View style={[styles.recordIconWrap, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="trophy-outline" size={20} color="#FBBF24" />
              </View>
              <Text style={styles.recordLabel}>LONGEST SINGLE TRIP</Text>
              <Text style={styles.recordValue}>
                {stats.longestTrip} <Text style={styles.recordUnit}>{settings.unit}</Text>
              </Text>
            </GlassCard>

            <GlassCard style={styles.recordCard}>
              <View style={[styles.recordIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="navigate-outline" size={20} color="#10B981" />
              </View>
              <Text style={styles.recordLabel}>TOTAL JOURNEYS</Text>
              <Text style={styles.recordValue}>
                {stats.totalTrips} <Text style={styles.recordUnit}>trips</Text>
              </Text>
            </GlassCard>
          </View>
        </View>

        {/* Category Breakdown Section */}
        <GlassCard style={styles.sectionMargin}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Activity Distribution</Text>
            <Text style={styles.cardSubtitle}>Breakdown by movement type</Text>
          </View>

          <CategoryBreakdown stats={categoryStats} unit={settings.unit} />
        </GlassCard>

        {/* Milestones & Badges */}
        <View style={styles.sectionMargin}>
          <View style={styles.milestoneHeaderRow}>
            <Text style={styles.sectionHeader}>Milestones & Achievements</Text>
            <Text style={styles.milestoneUnlockedCount}>
              {milestones.filter((m) => m.isUnlocked).length} / {milestones.length} Unlocked
            </Text>
          </View>

          {milestones.map((m) => (
            <MilestoneBadge key={m.id} milestone={m} unit={settings.unit} />
          ))}
        </View>
      </ScrollView>

      {/* Test celebration modal preview */}
      <CelebrationModal
        milestone={testMilestone}
        onDismiss={() => setTestMilestone(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  ambientGlow: {
    position: 'absolute',
    top: 100,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.8,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  timeframeSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
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
    marginBottom: 20,
    borderRadius: 24,
  },
  chartHeaderRow: {
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  sectionMargin: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  recordsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  recordCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  recordIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  recordLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  recordUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneUnlockedCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FBBF24',
  },
});
