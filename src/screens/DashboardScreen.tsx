import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTracker } from '../context/TrackerContext';
import { Colors } from '../theme/colors';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ActivitySparkline } from '../components/ActivitySparkline';
import { SwipeableEntryCard } from '../components/SwipeableEntryCard';
import { ActiveTripHUD } from '../components/ActiveTripHUD';
import { StartTripModal } from '../components/StartTripModal';
import { AddEntryModal } from './AddEntryModal';
import { computeChartData } from '../db/database';
import { CategoryType, Entry } from '../types';
import { triggerHaptic } from '../utils/haptics';

export const DashboardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    entries,
    stats,
    settings,
    activeTrip,
    startTrip,
    pauseTrip,
    resumeTrip,
    recordSegment,
    stopTrip,
    discardActiveTrip,
    simulateTripMotion,
    addEntry,
    editEntry,
    removeEntry,
    seedData,
  } = useTracker();

  const [startTripModalVisible, setStartTripModalVisible] = useState<boolean>(false);
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const weeklyData = computeChartData(entries, 'week');
  const recentEntries = entries.slice(0, 6);

  const handleOpenStartTrip = () => {
    triggerHaptic('medium');
    setStartTripModalVisible(true);
  };

  const handleStartTripConfirmed = async (category: CategoryType, notes?: string) => {
    const success = await startTrip(category, notes);
    if (!success) {
      Alert.alert(
        'Location Permission Needed',
        'Please grant location permissions to track your distance in real time.'
      );
    }
  };

  const handleStopTrip = async () => {
    triggerHaptic('heavy');
    const saved = await stopTrip();
    if (saved) {
      Alert.alert(
        'Trip Finalized & Saved! 📍',
        `Recorded ${saved.distance} ${settings.unit} (${saved.category}) across ${saved.segments_count || 1} leg(s).`
      );
    }
  };

  const handleDiscardTrip = () => {
    Alert.alert(
      'Discard Session?',
      'Are you sure you want to cancel? The live distance will not be saved.',
      [
        { text: 'Keep Tracking', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: discardActiveTrip,
        },
      ]
    );
  };

  const handleOpenEdit = (entry: Entry) => {
    setSelectedEntry(entry);
    setManualEntryModalVisible(true);
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      {/* Subtle Ambient Glows */}
      <View style={styles.glowBlobOne} />

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

          <View style={styles.headerActionsRow}>
            {entries.length === 0 && (
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  seedData();
                }}
                style={styles.seedButton}
              >
                <Ionicons name="sparkles" size={13} color="#00F2FE" />
                <Text style={styles.seedButtonText}>Demo</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                setSelectedEntry(null);
                setManualEntryModalVisible(true);
              }}
              style={styles.manualEntryBtn}
            >
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* ACTIVE LIVE TRIP HUD (When tracking or paused) */}
        {activeTrip.isTracking && (
          <ActiveTripHUD
            activeTrip={activeTrip}
            unit={settings.unit}
            onPause={pauseTrip}
            onResume={resumeTrip}
            onRecordSegment={recordSegment}
            onStop={handleStopTrip}
            onDiscard={handleDiscardTrip}
            onSimulate={() => simulateTripMotion(0.15)}
          />
        )}

        {/* START TRIP HERO BUTTON (When not tracking) */}
        {!activeTrip.isTracking && (
          <GlassCard
            style={styles.startHeroCard}
            borderHighlight
            glowColor="rgba(0, 242, 254, 0.2)"
            onPress={handleOpenStartTrip}
          >
            <View style={styles.startHeroContent}>
              <View style={styles.startHeroIconWrap}>
                <Ionicons name="play" size={26} color="#00F2FE" style={{ marginLeft: 3 }} />
              </View>
              <View style={styles.startHeroTextWrap}>
                <Text style={styles.startHeroTitle}>Start New Trip</Text>
                <Text style={styles.startHeroSubtitle}>
                  Track distance continuously across breaks and multiple segments
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#00F2FE" />
            </View>
          </GlassCard>
        )}

        {/* KPI Triad: Total, Month, Streak */}
        <View style={styles.kpiRow}>
          <GlassCard style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
              <Ionicons name="speedometer-outline" size={18} color="#00F2FE" />
            </View>
            <Text style={styles.kpiLabel}>TOTAL DISTANCE</Text>
            <AnimatedCounter
              value={stats.totalKm}
              suffix={settings.unit}
              decimals={1}
              style={styles.kpiValue}
            />
          </GlassCard>

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

          <GlassCard style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Ionicons name="flame-outline" size={18} color="#F97316" />
            </View>
            <Text style={styles.kpiLabel}>ACTIVE STREAK</Text>
            <AnimatedCounter
              value={stats.streakDays}
              suffix="d"
              decimals={0}
              style={[styles.kpiValue, { color: '#FB923C' }]}
            />
          </GlassCard>
        </View>

        {/* 7-DAY VELOCITY CHART */}
        <GlassCard style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>7-Day Velocity</Text>
              <Text style={styles.sectionSubtitle}>Daily distance recorded</Text>
            </View>
            <View style={styles.weekTotalPill}>
              <Text style={styles.weekTotalText}>
                {stats.weekKm} {settings.unit} this week
              </Text>
            </View>
          </View>

          <ActivitySparkline data={weeklyData} unit={settings.unit} height={130} />
        </GlassCard>

        {/* Recent Journeys */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <Text style={styles.countBadge}>{entries.length} recorded</Text>
          </View>

          {recentEntries.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="map-outline" size={38} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Trips Yet</Text>
              <Text style={styles.emptyDescription}>
                Tap "Start New Trip" above to begin your first live session.
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

      {/* Floating Bottom Quick Action */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 20 }]}>
        {activeTrip.isTracking ? (
          <Pressable onPress={handleStopTrip} style={styles.fabStopButton}>
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="stop" size={20} color="#EF4444" />
            <Text style={styles.fabStopText}>
              Finish Trip ({activeTrip.distanceKm.toFixed(1)} {settings.unit})
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleOpenStartTrip} style={styles.fabStartButton}>
            <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="play" size={20} color="#00F2FE" style={{ marginLeft: 2 }} />
            <Text style={styles.fabStartText}>Start Trip</Text>
          </Pressable>
        )}
      </View>

      {/* Start Trip Category Selector Modal */}
      <StartTripModal
        visible={startTripModalVisible}
        onClose={() => setStartTripModalVisible(false)}
        onStart={handleStartTripConfirmed}
      />

      {/* Manual Entry Modal */}
      <AddEntryModal
        visible={manualEntryModalVisible}
        onClose={() => setManualEntryModalVisible(false)}
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
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00F2FE',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  seedButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00F2FE',
  },
  manualEntryBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startHeroCard: {
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 242, 254, 0.07)',
  },
  startHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startHeroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 242, 254, 0.18)',
    borderWidth: 1.5,
    borderColor: '#00F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  startHeroTextWrap: {
    flex: 1,
  },
  startHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  startHeroSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 2,
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
    fontSize: 17,
    fontWeight: '900',
    color: '#00F2FE',
  },
  sectionCard: {
    marginBottom: 18,
    borderRadius: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weekTotalText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  recentSection: {
    marginTop: 2,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 18,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fabContainer: {
    position: 'absolute',
    right: 18,
    zIndex: 99,
  },
  fabStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 15, 26, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  fabStartText: {
    color: '#00F2FE',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fabStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(24, 10, 12, 0.94)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 8,
  },
  fabStopText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
