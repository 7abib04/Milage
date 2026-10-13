import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Milestone } from '../types';
import { Colors } from '../theme/colors';

interface MilestoneBadgeProps {
  milestone: Milestone;
  unit?: string;
  onPress?: () => void;
}

const getMilestoneIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
  switch (iconName) {
    case 'compass':
      return 'compass-outline';
    case 'zap':
      return 'flash-outline';
    case 'award':
      return 'ribbon-outline';
    case 'shield':
      return 'shield-checkmark-outline';
    case 'globe':
      return 'earth-outline';
    case 'crown':
      return 'trophy-outline';
    default:
      return 'star-outline';
  }
};

export const MilestoneBadge: React.FC<MilestoneBadgeProps> = ({ milestone, unit = 'km' }) => {
  const icon = getMilestoneIcon(milestone.icon);
  const glowColor = milestone.isUnlocked ? '#F59E0B' : Colors.textTertiary;

  return (
    <View
      style={[
        styles.container,
        milestone.isUnlocked ? styles.unlockedCard : styles.lockedCard,
      ]}
    >
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Header icon & status */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: milestone.isUnlocked
                ? 'rgba(245, 158, 11, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={24}
            color={milestone.isUnlocked ? '#FBBF24' : Colors.textTertiary}
          />
        </View>

        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: milestone.isUnlocked
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: milestone.isUnlocked ? '#34D399' : Colors.textTertiary },
            ]}
          >
            {milestone.isUnlocked ? 'UNLOCKED' : `${Math.round(milestone.progress * 100)}%`}
          </Text>
        </View>
      </View>

      {/* Title & description */}
      <Text style={styles.title}>{milestone.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {milestone.description}
      </Text>

      {/* Target & Progress bar */}
      <View style={styles.footerWrap}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round(milestone.progress * 100)}%`,
                backgroundColor: milestone.isUnlocked ? '#FBBF24' : '#00F2FE',
              },
            ]}
          />
        </View>
        <Text style={styles.targetLabel}>
          Target: {milestone.targetKm} {unit}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: Colors.glassBackground,
    marginBottom: 12,
  },
  unlockedCard: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  lockedCard: {
    borderColor: Colors.glassBorder,
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  footerWrap: {
    marginTop: 4,
  },
  track: {
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  targetLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
});
