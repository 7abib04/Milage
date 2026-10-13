import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  current: number;
  target: number;
  unit?: string;
  gradientColors?: [string, string];
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 180,
  strokeWidth = 14,
  current,
  target,
  unit = 'km',
  gradientColors = ['#00F2FE', '#4FACFE'],
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const normalizedProgress = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withTiming(normalizedProgress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [normalizedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progressAnim.value);
    return {
      strokeDashoffset,
    };
  });

  const percentage = Math.round((current / (target || 1)) * 100);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center Metrics */}
      <View style={styles.centerContent}>
        <Text style={styles.percentageText}>{percentage}%</Text>
        <Text style={styles.currentText}>
          {Math.round(current * 10) / 10}
          <Text style={styles.unitText}> {unit}</Text>
        </Text>
        <Text style={styles.targetLabel}>of {target} {unit} goal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00F2FE',
    letterSpacing: -0.5,
  },
  currentText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  targetLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
