import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../utils/haptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  onPress?: () => void;
  borderHighlight?: boolean;
  glowColor?: string;
  enableScale?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  intensity = 35,
  tint = 'dark',
  onPress,
  borderHighlight = false,
  glowColor,
  enableScale = true,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (onPress && enableScale) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      triggerHaptic('light');
    }
  };

  const handlePressOut = () => {
    if (onPress && enableScale) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const cardBorderColor = borderHighlight
    ? Colors.glassBorderHighlight
    : glowColor
    ? glowColor
    : Colors.glassBorder;

  const cardContent = (
    <View
      style={[
        styles.outerContainer,
        {
          borderColor: cardBorderColor,
          shadowColor: glowColor || '#000',
        },
        glowColor ? styles.glowingShadow : styles.defaultShadow,
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidFallback]} />
      )}
      <View style={[styles.innerContent, contentStyle]}>{children}</View>
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {cardContent}
        </Pressable>
      </Animated.View>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: Colors.glassBackground,
  },
  defaultShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  glowingShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  androidFallback: {
    backgroundColor: 'rgba(18, 24, 38, 0.85)',
  },
  innerContent: {
    padding: 18,
  },
});
