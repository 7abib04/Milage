import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ActiveTripState } from '../types';
import { Colors, getCategoryColor } from '../theme/colors';
import { formatDuration } from '../utils/geo';
import { GlassButton } from './GlassButton';
import { triggerHaptic } from '../utils/haptics';

interface ActiveTripHUDProps {
  activeTrip: ActiveTripState;
  unit?: string;
  onPause: () => void;
  onResume: () => void;
  onRecordSegment: () => void;
  onStop: () => void;
  onDiscard: () => void;
  onSimulate: () => void;
}

export const ActiveTripHUD: React.FC<ActiveTripHUDProps> = ({
  activeTrip,
  unit = 'km',
  onPause,
  onResume,
  onRecordSegment,
  onStop,
  onDiscard,
  onSimulate,
}) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);

  useEffect(() => {
    if (!activeTrip.isPaused) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 900, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 900 }),
          withTiming(0.9, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 1;
    }
  }, [activeTrip.isPaused]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  const categoryColors = getCategoryColor(activeTrip.category);
  const currentSegmentNumber = activeTrip.segments.length + 1;

  return (
    <View style={[styles.container, activeTrip.isPaused && styles.containerPaused]}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.liveIndicatorRow}>
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseCircle,
                pulseStyle,
                activeTrip.isPaused && { backgroundColor: '#F59E0B' },
              ]}
            />
            <View
              style={[
                styles.solidDot,
                activeTrip.isPaused && { backgroundColor: '#F59E0B' },
              ]}
            />
          </View>
          <Text
            style={[
              styles.liveText,
              activeTrip.isPaused && { color: '#F59E0B' },
            ]}
          >
            {activeTrip.isPaused ? 'SESSION PAUSED (KEEPING DATA)' : 'RECORDING SESSION'}
          </Text>
        </View>

        <View style={styles.topRightPills}>
          <View style={styles.segmentPill}>
            <Text style={styles.segmentPillText}>Leg {currentSegmentNumber}</Text>
          </View>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: categoryColors.glass, borderColor: categoryColors.border },
            ]}
          >
            <Text style={[styles.categoryText, { color: categoryColors.primary }]}>
              {activeTrip.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Cumulative Live Distance Counter */}
        <View style={styles.metricBlockMain}>
          <Text style={styles.metricLabel}>TOTAL CUMULATIVE DISTANCE</Text>
          <View style={styles.distanceValueRow}>
            <Text style={styles.distanceValueText}>
              {activeTrip.distanceKm.toFixed(2)}
            </Text>
            <Text style={styles.unitText}> {unit}</Text>
          </View>
          {activeTrip.segments.length > 0 && (
            <Text style={styles.subSegmentNote}>
              Current segment: {activeTrip.currentSegmentDistanceKm.toFixed(2)} {unit}
            </Text>
          )}
        </View>

        {/* Live Timer */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>TOTAL TIME</Text>
          <Text style={styles.timerValueText}>
            {formatDuration(activeTrip.elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Mid Row: Speed & Tools */}
      <View style={styles.submetricsRow}>
        <View style={styles.submetricItem}>
          <Ionicons name="speedometer-outline" size={16} color="#00F2FE" />
          <Text style={styles.submetricText}>
            {activeTrip.isPaused ? 'Paused' : `${activeTrip.currentSpeedKmh.toFixed(1)} km/h`}
          </Text>
        </View>

        <View style={styles.midButtonsGroup}>
          {/* Segment Mark Button */}
          <Pressable
            style={styles.markSegmentBtn}
            onPress={() => {
              triggerHaptic('light');
              onRecordSegment();
            }}
          >
            <Ionicons name="flag-outline" size={13} color="#A78BFA" />
            <Text style={styles.markSegmentText}>Mark Leg</Text>
          </Pressable>

          {/* Emulator / Test Motion Simulator */}
          <Pressable
            style={styles.simulateBtn}
            onPress={() => {
              triggerHaptic('light');
              onSimulate();
            }}
          >
            <Ionicons name="add" size={14} color="#34D399" />
            <Text style={styles.simulateText}>+0.15 km</Text>
          </Pressable>
        </View>
      </View>

      {/* Main Action Controls */}
      <View style={styles.actionsRow}>
        {/* Pause / Resume Button */}
        {activeTrip.isPaused ? (
          <GlassButton
            label="Continue Trip"
            onPress={onResume}
            variant="primary"
            size="md"
            icon={<Ionicons name="play" size={18} color="#00F2FE" />}
            style={{ flex: 1 }}
          />
        ) : (
          <GlassButton
            label="Pause"
            onPress={onPause}
            variant="secondary"
            size="md"
            icon={<Ionicons name="pause" size={18} color="#fff" />}
            style={{ flex: 1 }}
          />
        )}

        {/* Finish & Finalize Button */}
        <GlassButton
          label="Finish & Save"
          onPress={onStop}
          variant="danger"
          size="md"
          icon={<Ionicons name="stop-circle" size={18} color={Colors.danger} />}
          style={{ flex: 1.2 }}
        />

        {/* Discard */}
        <Pressable
          style={styles.discardBtn}
          onPress={() => {
            triggerHaptic('warning');
            onDiscard();
          }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    backgroundColor: 'rgba(10, 18, 30, 0.88)',
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  containerPaused: {
    borderColor: 'rgba(245, 158, 11, 0.5)',
    shadowColor: '#F59E0B',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00F2FE',
  },
  solidDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F2FE',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F2FE',
    letterSpacing: 0.6,
  },
  topRightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentPill: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  segmentPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
  },
  metricBlockMain: {
    flex: 1,
  },
  metricBlock: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  distanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceValueText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  subSegmentNote: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  timerValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  submetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  submetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submetricText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  midButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  markSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  simulateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discardBtn: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
