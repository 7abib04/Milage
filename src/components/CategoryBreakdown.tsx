import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryStat, CategoryType } from '../types';
import { Colors, getCategoryColor } from '../theme/colors';

interface CategoryBreakdownProps {
  stats: CategoryStat[];
  unit?: string;
}

const getCategoryIcon = (category: CategoryType): keyof typeof Ionicons.glyphMap => {
  switch (category) {
    case 'Driving':
      return 'car-sport-outline';
    case 'Running':
      return 'flame-outline';
    case 'Walking':
      return 'walk-outline';
    case 'Cycling':
      return 'bicycle-outline';
    default:
      return 'navigate-outline';
  }
};

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ stats, unit = 'km' }) => {
  const activeStats = stats.filter((s) => s.totalKm > 0);

  return (
    <View style={styles.container}>
      {/* Liquid Segmented Progress Bar */}
      <View style={styles.segmentTrack}>
        {activeStats.length === 0 ? (
          <View style={[styles.segmentPart, { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)' }]} />
        ) : (
          activeStats.map((item, index) => (
            <View
              key={item.category}
              style={[
                styles.segmentPart,
                {
                  flex: Math.max(0.05, item.percentage),
                  backgroundColor: item.color,
                  marginRight: index < activeStats.length - 1 ? 2 : 0,
                },
              ]}
            />
          ))
        )}
      </View>

      {/* Category Cards Grid */}
      <View style={styles.grid}>
        {stats.map((item) => {
          const colors = getCategoryColor(item.category);
          const icon = getCategoryIcon(item.category);

          return (
            <View key={item.category} style={[styles.badgeCard, { borderColor: colors.border }]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.glass }]}>
                <Ionicons name={icon} size={18} color={colors.primary} />
              </View>

              <View style={styles.infoWrap}>
                <View style={styles.titleRow}>
                  <Text style={styles.categoryTitle}>{item.category}</Text>
                  <Text style={[styles.percentageBadge, { color: colors.primary }]}>
                    {item.percentage}%
                  </Text>
                </View>

                <Text style={styles.distanceValue}>
                  {item.totalKm} <Text style={styles.unitText}>{unit}</Text>
                </Text>
                <Text style={styles.tripCount}>{item.count} {item.count === 1 ? 'trip' : 'trips'}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  segmentTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  segmentPart: {
    height: '100%',
    borderRadius: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  percentageBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  tripCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
});
