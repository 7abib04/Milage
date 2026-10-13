import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ChartDataPoint } from '../types';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../utils/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ActivitySparklineProps {
  data: ChartDataPoint[];
  unit?: string;
  height?: number;
  barColor?: string;
  gradientCap?: string;
}

const ChartBarItem: React.FC<{
  item: ChartDataPoint;
  index: number;
  isSelected: boolean;
  maxVal: number;
  chartHeight: number;
  barColor: string;
  gradientCap: string;
  unit: string;
  onSelect: (index: number) => void;
}> = ({
  item,
  index,
  isSelected,
  maxVal,
  chartHeight,
  barColor,
  gradientCap,
  unit,
  onSelect,
}) => {
  const ratio = maxVal > 0 ? Math.min(1, Math.max(0.04, item.value / maxVal)) : 0.04;
  const barHeight = ratio * chartHeight;

  return (
    <Pressable
      style={styles.barColumn}
      onPress={() => {
        triggerHaptic('light');
        onSelect(index);
      }}
    >
      {/* Tooltip on selection */}
      {isSelected && (
        <View style={styles.tooltipContainer}>
          <Text style={styles.tooltipText}>
            {item.value} {unit}
          </Text>
        </View>
      )}

      {/* Bar container */}
      <View style={[styles.barTrack, { height: chartHeight }]}>
        <View
          style={[
            styles.barFill,
            {
              height: barHeight,
              backgroundColor: isSelected ? gradientCap : barColor,
              shadowColor: isSelected ? gradientCap : barColor,
            },
            isSelected && styles.barFillSelected,
          ]}
        >
          <View
            style={[
              styles.barCap,
              { backgroundColor: gradientCap },
            ]}
          />
        </View>
      </View>

      {/* X-axis label */}
      <Text
        style={[
          styles.label,
          isSelected && styles.labelSelected,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
};

export const ActivitySparkline: React.FC<ActivitySparklineProps> = ({
  data,
  unit = 'km',
  height = 140,
  barColor = 'rgba(0, 242, 254, 0.45)',
  gradientCap = '#00F2FE',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    data.length > 0 ? data.length - 1 : null
  );

  const maxValue = Math.max(...data.map((d) => d.value), 5);

  const handleSelect = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedIndex(idx === selectedIndex ? null : idx);
  };

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>No activity data for this timeframe</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chart Grid Lines */}
      <View style={[styles.gridContainer, { height }]}>
        <View style={styles.gridLine} />
        <View style={styles.gridLine} />
        <View style={styles.gridLine} />
      </View>

      {/* Bars row */}
      <View style={[styles.barsRow, { height: height + 24 }]}>
        {data.map((item, idx) => (
          <ChartBarItem
            key={`${item.label}-${idx}`}
            item={item}
            index={idx}
            isSelected={selectedIndex === idx}
            maxVal={maxValue}
            chartHeight={height}
            barColor={barColor}
            gradientCap={gradientCap}
            unit={unit}
            onSelect={handleSelect}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    paddingVertical: 10,
  },
  gridContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  tooltipContainer: {
    position: 'absolute',
    top: -24,
    backgroundColor: 'rgba(10, 15, 25, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    zIndex: 10,
  },
  tooltipText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '700',
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '55%',
    maxWidth: 22,
    minWidth: 8,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  barFillSelected: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  barCap: {
    height: 3,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  label: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  labelSelected: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
});
