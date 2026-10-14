import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Entry } from '../types';
import { Colors, getCategoryColor } from '../theme/colors';
import { formatDateDisplay } from '../utils/formatters';
import { triggerHaptic } from '../utils/haptics';

interface SwipeableEntryCardProps {
  entry: Entry;
  unit?: string;
  onPress: (entry: Entry) => void;
  onDelete: (id: number) => void;
}

const ACTION_WIDTH = 80;

export const SwipeableEntryCard: React.FC<SwipeableEntryCardProps> = ({
  entry,
  unit = 'km',
  onPress,
  onDelete,
}) => {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(90);
  const opacity = useSharedValue(1);

  const colors = getCategoryColor(entry.category);

  const getCategoryIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (entry.category) {
      case 'Driving':
        return 'car-sport-outline';
      case 'Running':
        return 'flame-outline';
      case 'Walking':
      default:
        return 'walk-outline';
      case 'Cycling':
        return 'bicycle-outline';
    }
  };

  const executeDelete = () => {
    triggerHaptic('heavy');
    translateX.value = withTiming(-400, { duration: 250 });
    opacity.value = withTiming(0, { duration: 200 });
    itemHeight.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onDelete)(entry.id);
      }
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(-ACTION_WIDTH - 20, e.translationX);
      } else if (translateX.value < 0) {
        translateX.value = Math.min(0, -ACTION_WIDTH + e.translationX);
      }
    })
    .onEnd((e) => {
      if (e.translationX < -40) {
        translateX.value = withSpring(-ACTION_WIDTH, { damping: 20, stiffness: 300 });
        runOnJS(triggerHaptic)('light');
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      maxHeight: itemHeight.value === 0 ? 0 : 120,
      opacity: opacity.value,
      marginBottom: itemHeight.value === 0 ? 0 : 10,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background Delete Action */}
      <View style={styles.actionContainer}>
        <Pressable
          style={styles.deleteButton}
          onPress={executeDelete}
        >
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>

      {/* Foreground Interactive Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Pressable
            style={styles.pressableContent}
            onPress={() => {
              if (translateX.value < -10) {
                translateX.value = withSpring(0);
              } else {
                triggerHaptic('light');
                onPress(entry);
              }
            }}
          >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

            {/* Category Icon */}
            <View style={[styles.iconWrap, { backgroundColor: colors.glass }]}>
              <Ionicons name={getCategoryIcon()} size={22} color={colors.primary} />
            </View>

            {/* Main Info */}
            <View style={styles.contentWrap}>
              <View style={styles.rowTop}>
                <Text style={styles.categoryTitle}>{entry.category}</Text>
                <Text style={styles.distanceText}>
                  {entry.distance} <Text style={styles.unitText}>{unit}</Text>
                </Text>
              </View>

              <View style={styles.rowBottom}>
                <Text style={styles.dateText}>{formatDateDisplay(entry.date)}</Text>
                {entry.start_time && entry.end_time ? (
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={11} color={Colors.textTertiary} />
                    <Text style={styles.timeText}>
                      {entry.start_time.slice(0, 5)} - {entry.end_time.slice(0, 5)}
                    </Text>
                  </View>
                ) : null}
                {entry.segments_count && entry.segments_count > 1 ? (
                  <View style={styles.segmentBadge}>
                    <Text style={styles.segmentText}>{entry.segments_count} legs</Text>
                  </View>
                ) : null}
                {entry.notes ? (
                  <Text style={styles.notesText} numberOfLines={1} ellipsizeMode="tail">
                    {entry.notes}
                  </Text>
                ) : null}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  actionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.dangerGlass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  deleteText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: Colors.glassBackground,
    overflow: 'hidden',
    zIndex: 2,
  },
  pressableContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contentWrap: {
    flex: 1,
    marginRight: 8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  distanceText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#00F2FE',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    fontStyle: 'italic',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  segmentBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  segmentText: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '700',
  },
});
