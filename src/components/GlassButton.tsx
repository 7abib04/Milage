import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors } from '../theme/colors';
import { triggerHaptic } from '../utils/haptics';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  label,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.95, { damping: 15, stiffness: 350 });
    triggerHaptic('light');
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 350 });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
          border: 'rgba(0, 242, 254, 0.4)',
        };
      case 'danger':
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
          border: Colors.dangerBorder,
        };
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
          border: Colors.glassBorderHighlight,
        };
      case 'glass':
      default:
        return {
          container: styles.glassContainer,
          text: styles.glassText,
          border: Colors.glassBorder,
        };
    }
  };

  const variantStyle = getVariantStyles();

  const sizePadding =
    size === 'sm'
      ? { paddingVertical: 8, paddingHorizontal: 14 }
      : size === 'lg'
      ? { paddingVertical: 18, paddingHorizontal: 28 }
      : { paddingVertical: 14, paddingHorizontal: 20 };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.buttonBase,
          variantStyle.container,
          sizePadding,
          { borderColor: variantStyle.border },
          disabled && styles.disabled,
        ]}
      >
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text
            style={[
              styles.labelText,
              variantStyle.text,
              size === 'sm' && styles.textSm,
              size === 'lg' && styles.textLg,
              textStyle,
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 18,
  },
  primaryContainer: {
    backgroundColor: 'rgba(0, 242, 254, 0.18)',
    shadowColor: Colors.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  primaryText: {
    color: '#00F2FE',
  },
  secondaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryText: {
    color: Colors.textPrimary,
  },
  dangerContainer: {
    backgroundColor: Colors.dangerGlass,
  },
  dangerText: {
    color: Colors.danger,
  },
  glassContainer: {
    backgroundColor: Colors.glassBackground,
  },
  glassText: {
    color: Colors.textSecondary,
  },
  disabled: {
    opacity: 0.4,
  },
});
