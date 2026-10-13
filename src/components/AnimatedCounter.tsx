import React, { useEffect } from 'react';
import { StyleSheet, Text, TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 1,
  prefix = '',
  suffix = '',
  style,
  duration = 900,
}) => {
  const [displayValue, setDisplayValue] = React.useState<number>(value);
  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(
      value,
      {
        duration,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setDisplayValue)(value);
        }
      }
    );

    // Interval interpolation for smooth display update
    const startTime = Date.now();
    const startVal = displayValue;
    const diff = value - startVal;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startVal + diff * eased);

      if (progress >= 1) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [value, duration]);

  const formatted = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals === 0 ? 0 : decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <Text style={[styles.defaultText, style]}>
      {prefix}
      {formatted}
      {suffix ? ` ${suffix}` : ''}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 28,
  },
});
