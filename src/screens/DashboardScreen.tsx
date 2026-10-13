import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTracker } from '../context/TrackerContext';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ProgressRing } from '../components/ProgressRing';
import { ActivitySparkline } from '../components/ActivitySparkline';
import { SwipeableEntryCard } from '../components/SwipeableEntryCard';
import { AddEntryModal } from './AddEntryModal';
import { CelebrationModal } from '../components/CelebrationModal';
import { computeChartData } from '../db/database';
import { Entry } from '../types';
import { triggerHaptic } from '../utils/haptics';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    entries,
    stats,
    settings,
    addEntry,
    editEntry,
    removeEntry,
    celebrationMilestone,
    dismissCelebration,
    seedData,
  } = useTracker();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const weeklyData = computeChartData(entries, 'week');
  const recentEntries = entries.slice(0, 5);

  const handleOpenAdd = () => {
    setSelectedEntry(null);
    triggerHaptic('medium');
    setModalVisible(true);
  };

  const handleOpenEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setModalVisible(true);
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Background Liquid Atmosphere */}
      <View style={styles.glowBlobOne} />
      <View style={styles.glowBlobTwo} />

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
            <Text style={styles.dateSubtitle}>{todayDateString}</Text>
            <Text style={styles.headerTitle}>KM Tracker</Text>
          </View>

          {entries.length === 0 && (
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                seedData();
              }}
              style={styles.seedButton}
            >
              <Ionicons name="sparkles" size={14} color="#00F2FE" />
              <Text style={styles.seedButtonText}>Demo Data</Text>
            </Pressable>
          )}
        </View>

        {/* Hero Goal Progress Card */}
        <GlassCard style={styles.heroCard} borderHighlight glowColor="rgba(0, 242, 254, 0.2)">
          <View style={styles.heroContentRow}>
            <View style={styles.heroTextWrap}>
              <View style={styles.heroPill}>
                <Ionicons name="flag" size={12} color="#00F2FE" />
                <Text style={styles.heroPillText}>MONTHLY GOAL</Text>
              </View>

              <Text style={styles.heroTitle}>Monthly Target</Text>
              <Text style={styles.heroDescription}>
                Keep the momentum going to achieve your distance milestone.
              </Text>

              <View style={styles.heroStatsMiniRow}>
                <View>
                  <Text style={styles.miniLabel}>Remaining</Text>
                  <Text style={styles.miniValue}>
                    {Math.max(0, Math.round((settings.monthlyGoalKm - stats.monthKm) * 10) / 10)}{' '}
                    {settings.unit}
                  </Text>
                </View>
                <View style={styles.verticalDivider} />
                <View>
                  <Text style={styles.miniLabel}>Avg Trip</Text>
                  <Text style={styles.miniValue}>
                    {stats.averageTrip} {settings.unit}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.ringContainer}>
              <ProgressRing
                size={140}
                strokeWidth={12}
                current={stats.monthKm}
                target={settings.monthlyGoalKm}
                unit={settings.unit}
              />
            </View>
          </View>
        </GlassCard>

        {/* KPI Triad Cards */}
        <View style={styles.kpiRow}>
          {/* Total KMs */}
          <GlassCard style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
              <Ionicons name="earth" size={18} color="#00F2FE" />
            </View>
            <Text style={styles.kpiLabel}>TOTAL DISTANCE</Text>
            <AnimatedCounter
              value={stats.totalKm}
              suffix={settings.unit}
              decimals={1}
              style={styles.kpiValue}
            />
          </GlassCard>

          {/* This Month */}
          <GlassCard style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Ionicons name="calendar-outline" size={18} color="#A855F7" />
            </View>
            <Text style={styles.kpiLabel}>THIS MONTH</Text>
            <AnimatedCounter
              value={stats.monthKm}
              suffix={settings.unit}
              decimals={1}
              style={[styles.kpiValue, { color: '#C084FC' }]}
            />
          </GlassCard>

          {/* Day Streak */}
          <GlassCard style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Ionicons name="flame" size={18} color="#F97316" />
            </View>
            <Text style={styles.kpiLabel}>ACTIVE STREAK</Text>
            <AnimatedCounter
              value={stats.streakDays}
              suffix="days"
              decimals={0}
              style={[styles.kpiValue, { color: '#FB923C' }]}
            />
          </GlassCard>
        </View>

        {/* Weekly Activity Sparkline */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>7-Day Velocity</Text>
              <Text style={styles.sectionSubtitle}>Daily distance logged</Text>
            </View>
            <View style={styles.weekTotalPill}>
              <Text style={styles.weekTotalText}>
                {stats.weekKm} {settings.unit} this week
              </Text>
            </View>
          </View>

          <ActivitySparkline data={weeklyData} unit={settings.unit} height={120} />
        </GlassCard>

        {/* Recent Activity Feed */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Journeys</Text>
            <Text style={styles.countBadge}>{entries.length} logged</Text>
          </View>

          {recentEntries.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="speedometer-outline" size={42} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Entries Recorded Yet</Text>
              <Text style={styles.emptyDescription}>
                Tap the "+ Log KM" button below or load demo data to get started.
              </Text>
            </GlassCard>
          ) : (
            recentEntries.map((item) => (
              <SwipeableEntryCard
                key={item.id}
                entry={item}
                unit={settings.unit}
                onPress={handleOpenEdit}
                onDelete={removeEntry}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}>
        <Pressable
          onPress={handleOpenAdd}
          style={styles.fabButton}
        >
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="add" size={26} color="#00F2FE" />
          <Text style={styles.fabText}>Add KM</Text>
        </Pressable>
      </View>

      {/* Add / Edit Entry Modal */}
      <AddEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (data) => {
          if (selectedEntry) {
            await editEntry({ ...selectedEntry, ...data });
          } else {
            await addEntry(data);
          }
        }}
        editingEntry={selectedEntry}
        unit={settings.unit}
      />

      {/* Milestone Celebratory Modal */}
      <CelebrationModal
        milestone={celebrationMilestone}
        onDismiss={dismissCelebration}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowBlobOne: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  glowBlobTwo: {
    position: 'absolute',
    top: 250,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00F2FE',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  seedButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00F2FE',
  },
  heroCard: {
    marginBottom: 16,
    borderRadius: 28,
  },
  heroContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  heroDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  heroStatsMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  miniLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 4,
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00F2FE',
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  weekTotalPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  weekTotalText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  recentSection: {
    marginTop: 4,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 99,
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 15, 26, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: {
    color: '#00F2FE',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
