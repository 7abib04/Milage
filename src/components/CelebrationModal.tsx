import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Milestone } from '../types';
import { Colors } from '../theme/colors';
import { GlassButton } from './GlassButton';
import { triggerHaptic } from '../utils/haptics';

const { width, height } = Dimensions.get('window');

interface CelebrationModalProps {
  milestone: Milestone | null;
  onDismiss: () => void;
}

const PARTICLE_COUNT = 16;
const PARTICLE_COLORS = ['#00F2FE', '#4FACFE', '#FBBF24', '#F43F5E', '#10B981', '#A855F7'];

const Particle: React.FC<{ index: number }> = ({ index }) => {
  const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
  const distance = 110 + (index % 4) * 25;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance;

  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.4, { duration: 150 }),
      withTiming(0.8, { duration: 600 })
    );

    posX.value = withSpring(targetX, { damping: 12, stiffness: 120 });
    posY.value = withSpring(targetY, { damping: 12, stiffness: 120 });

    opacity.value = withDelay(
      450,
      withTiming(0, { duration: 350 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: posX.value },
        { translateY: posY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  milestone,
  onDismiss,
}) => {
  const modalScale = useSharedValue(0.7);
  const trophyRotation = useSharedValue(0);

  useEffect(() => {
    if (milestone) {
      triggerHaptic('success');
      modalScale.value = withSpring(1, { damping: 14, stiffness: 200 });
      trophyRotation.value = withSequence(
        withTiming(-0.15, { duration: 100 }),
        withTiming(0.15, { duration: 150 }),
        withTiming(-0.08, { duration: 120 }),
        withSpring(0)
      );
    } else {
      modalScale.value = 0.7;
    }
  }, [milestone]);

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: modalScale.value }],
    };
  });

  const trophyAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${trophyRotation.value}rad` }],
    };
  });

  if (!milestone) return null;

  return (
    <Modal
      transparent
      visible={!!milestone}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Particles */}
        <View style={styles.particlesContainer}>
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} />
          ))}
        </View>

        {/* Modal Card */}
        <Animated.View style={[styles.card, modalAnimatedStyle]}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />

          {/* Trophy Icon */}
          <Animated.View style={[styles.trophyWrap, trophyAnimatedStyle]}>
            <Ionicons name="trophy" size={54} color="#FBBF24" />
          </Animated.View>

          <Text style={styles.eyebrow}>MILESTONE UNLOCKED!</Text>
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.description}>{milestone.description}</Text>

          <View style={styles.pillBadge}>
            <Ionicons name="ribbon-outline" size={16} color="#00F2FE" />
            <Text style={styles.pillText}>{milestone.targetKm} KM Achieved</Text>
          </View>

          <GlassButton
            label="Claim & Continue"
            onPress={() => {
              triggerHaptic('medium');
              onDismiss();
            }}
            variant="primary"
            size="lg"
            style={styles.actionButton}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  particlesContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(20, 26, 42, 0.85)',
    padding: 28,
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 12,
  },
  trophyWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00F2FE',
  },
  actionButton: {
    width: '100%',
  },
});
